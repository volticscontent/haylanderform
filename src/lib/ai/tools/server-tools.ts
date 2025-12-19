import pool from '../../db';

// Ferramentas do Workflow (Server-Side Tools)

function normalizeKey(key: string): string {
  const mapping: Record<string, string> = {
    'teria_interesse': 'interesse_ajuda',
    'qualificação': 'qualificacao',
    'motivo_qualificação': 'motivo_qualificacao',
    'tipo_negócio': 'tipo_negocio',
    'possui_sócio': 'possui_socio',
    'cartão-cnpj': 'cartao_cnpj',
    'serviço_escolhido': 'servico_negociado',
    'reunião_agendada': 'reuniao_agendada',
    'data_reunião': 'data_reuniao',
    'confirmação_qualificação': 'confirmacao_qualificacao'
  };
  return mapping[key] || key;
}

// 1. get_User
export async function getUser(phone: string): Promise<string> {
  try {
    let query = 'SELECT * FROM leads WHERE telefone = $1';
    let params = [phone];

    // Handle Brazil 9th digit variation for lookup
    if (phone.startsWith('55') && (phone.length === 12 || phone.length === 13)) {
       let altPhone = '';
       if (phone.length === 13) {
           altPhone = phone.slice(0, 4) + phone.slice(5); // Remove 9
       } else {
           altPhone = phone.slice(0, 4) + '9' + phone.slice(4); // Add 9
       }
       if (altPhone) {
           query = 'SELECT * FROM leads WHERE telefone = $1 OR telefone = $2 LIMIT 1';
           params = [phone, altPhone];
       }
    }

    const res = await pool.query(query, params);
    if (res.rows.length === 0) {
      return JSON.stringify({ status: "not_found", message: "Cliente não encontrado." });
    }
    return JSON.stringify(res.rows[0]);
  } catch (error: unknown) {
    console.error('Error fetching user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return JSON.stringify({ status: "error", message: errorMessage });
  }
}

// 6. searchServices (Knowledge Base)
export async function searchServices(query: string): Promise<string> {
  // Mock knowledge base
  const services = [
    { name: "Regularização MEI/CNPJ Inapto", description: "Regularização de pendências e CNPJ inapto." },
    { name: "Parcelamento de Dívidas", description: "Parcelamento de dívidas federais e ativas em até 60x." },
    { name: "Planejamento Tributário", description: "Análise para redução de carga tributária legal." },
    { name: "Abertura de Empresas", description: "Processo completo de abertura de empresas." },
    { name: "Transformação de MEI para ME", description: "Migração de regime tributário." },
    { name: "BPO Financeiro", description: "Terceirização da gestão financeira." },
    { name: "Certificado Digital", description: "Emissão e renovação de certificado digital." },
    { name: "Imposto de Renda", description: "Declaração de imposto de renda pessoa física e jurídica." }
  ];

  const lowerQuery = query.toLowerCase();
  const results = services.filter(s => 
    s.name.toLowerCase().includes(lowerQuery) || 
    s.description.toLowerCase().includes(lowerQuery)
  );

  if (results.length === 0) {
    return JSON.stringify({ 
      status: "no_results", 
      message: "Nenhum serviço específico encontrado para essa busca. Serviços gerais: " + services.map(s => s.name).join(", ") 
    });
  }

  return JSON.stringify({ 
    status: "success", 
    results 
  });
}

// 1.1 select_User (Prompt Alias)
export async function selectUser(phone: string): Promise<string> {
  return await getUser(phone);
}

// 8. enviar_lista_enumerada (Behavior Mock)
export async function sendEnumeratedList(): Promise<string> {
  const list = `
1. Regularização
2. Abertura de MEI
3. Falar com atendente
4. Informações sobre os serviços
5. Sair do atendimento
`;
  return JSON.stringify({ status: "displayed", message: "Lista de opções exibida.", content: list });
}

// 9. envio_vd (Commercial Presentation)
export async function sendCommercialPresentation(_phone: string, type: 'apc' | 'video' = 'apc'): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = _phone; 
  const messages = {
    apc: "Apresentação comercial enviada: [Link PDF]",
    video: "Vídeo tutorial enviado: [Link Vídeo]"
  };
  return JSON.stringify({ 
    status: "sent", 
    message: messages[type] || messages.apc,
    type 
  });
}

// 2. update_User
export async function updateUser(params: {
  telefone: string;
  situacao?: string;
  qualificacao?: string;
  motivo_qualificacao?: string;
  nome_completo?: string;
  cnpj?: string;
  observacoes?: string;
  email?: string;
  data_reuniao?: Date | null;
  [key: string]: string | Date | null | undefined;
}): Promise<string> {
  const { telefone, ...updates } = params;
  
  if (!telefone) {
    return JSON.stringify({ status: "error", message: "Telefone é obrigatório." });
  }

  try {
    // Check if user exists
    let check = await pool.query('SELECT id, telefone FROM leads WHERE telefone = $1', [telefone]);
    
    // If not found, try alternative format for Brazil
    if (check.rows.length === 0 && telefone.startsWith('55')) {
         let altPhone = '';
         if (telefone.length === 13) altPhone = telefone.slice(0, 4) + telefone.slice(5);
         else if (telefone.length === 12) altPhone = telefone.slice(0, 4) + '9' + telefone.slice(4);
         
         if (altPhone) {
             const altCheck = await pool.query('SELECT id, telefone FROM leads WHERE telefone = $1', [altPhone]);
             if (altCheck.rows.length > 0) {
                 check = altCheck;
             }
         }
    }
    
    // Normalize keys
    const normalizedUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      const normKey = normalizeKey(key);
      let normValue = value;

      // Sanitize empty strings for enum fields to avoid constraint violations
      if (normKey === 'qualificacao' && normValue === '') {
        normValue = null;
      }
      
      // Map frontend status to database status if needed
      if (normKey === 'situacao' && normValue === 'aguardando_qualificação') {
         normValue = 'nao_respondido';
      }

      normalizedUpdates[normKey] = normValue;
    }

    if (check.rows.length === 0) {
      // Create user if not exists (although workflow implies update usually follows creation)
      // Construct INSERT query dynamically or just basic fields
      const keys = ['telefone', 'data_cadastro', ...Object.keys(normalizedUpdates)];
      const values = [telefone, new Date(), ...Object.values(normalizedUpdates)];
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `INSERT INTO leads (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return JSON.stringify({ status: "created", data: res.rows[0] });
    } else {
      // Update existing
      const targetPhone = check.rows[0].telefone || telefone;
      const keys = Object.keys(normalizedUpdates);
      if (keys.length === 0) return JSON.stringify({ status: "no_changes" });

      const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
      const values = [targetPhone, ...Object.values(normalizedUpdates)];
      
      // Add atualizado_em
      const query = `UPDATE leads SET ${setClause}, atualizado_em = NOW() WHERE telefone = $1 RETURNING *`;
      const res = await pool.query(query, values);
      return JSON.stringify({ status: "updated", data: res.rows[0] });
    }
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return JSON.stringify({ status: "error", message: errorMessage });
  }
}

// 2.1 update_User1 (Prompt Specific Tool)
export async function updateUser1(params: {
  telefone: string;
  situacao: string;
  qualificacao: string;
}): Promise<string> {
  // Enforces the strict requirements of the prompt
  return await updateUser(params);
}

// 3. enviar_formulario (Simulation)
export async function sendForm(phone: string, observacao?: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let link = `${baseUrl}/${phone}`;
  if (observacao) {
    link = `${baseUrl}/${phone}/${encodeURIComponent(observacao)}`;
  }

  return JSON.stringify({
    status: "sent",
    message: "Formulário enviado com sucesso.",
    link: link // Uses [phone] page route
  });
}

// 4. agendar_reuniao
export async function scheduleMeeting(phone?: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const link = phone ? `${baseUrl}/reuniao/${phone}` : `${baseUrl}/reuniao`;

  return JSON.stringify({
    status: "success",
    message: "Link de agendamento gerado.",
    link: link
  });
}

// 5. chamar_atendente
export async function callAttendant(phone: string, reason: string): Promise<string> {
  // Logic to notify human (e.g., via email, Slack, or update DB status)
  try {
    // Append to observacoes instead of changing restricted situacao column
    await pool.query(`
      UPDATE leads 
      SET observacoes = CASE 
        WHEN observacoes IS NULL THEN $2 
        ELSE observacoes || E'\n' || $2 
      END 
      WHERE telefone = $1`, 
      [phone, `[Sistema] Cliente solicitou falar com atendente. Motivo: ${reason}`]
    );

    // Send WhatsApp Notification to Attendant
    const attendantNumber = "553182354127"; // Configured attendant number
    const instanceId = process.env.EVOLUTION_INSTANCE_NAME || "3198235127"; // Use env var or fallback to JSON ID
    const apiUrl = `${process.env.EVOLUTION_API_URL || 'https://evolutionapi.landcriativa.com'}/message/sendText/${instanceId}`;
    const apiKey = process.env.EVOLUTION_API_KEY || 'isfEQhkHq5tnvAa04A6VMisTec8JbvGW';

    console.log(`Sending notification to attendant ${attendantNumber} via ${apiUrl}...`);

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey
        },
        body: JSON.stringify({
            number: attendantNumber,
            text: `🔔 *Solicitação de Atendimento*\n\nO cliente *${phone}* solicitou falar com um atendente.\n\n📝 *Motivo:* ${reason}\n\n🔗 *Link para conversa:* https://wa.me/${phone}`
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send WhatsApp notification:", errorText);
    } else {
        console.log("Notification sent successfully.");
    }

    return JSON.stringify({ status: "success", message: "Atendente notificado. Aguarde um momento." });
  } catch (error: unknown) {
    console.error('Error calling attendant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return JSON.stringify({ status: "error", message: errorMessage });
  }
}
