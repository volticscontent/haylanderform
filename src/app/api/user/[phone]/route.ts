import { NextResponse } from "next/server";
import { Client } from "pg";

const getClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const phone = (await params).phone;
  const client = getClient();

  try {
    await client.connect();
    const query = "SELECT * FROM haylander WHERE telefone = $1";
    const res = await client.query(query, [phone]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const phone = (await params).phone;
  const body = await request.json();
  const client = getClient();

  // Map fields to columns
  // Note: We are careful with quotes for columns with special characters
  const {
    email,
    senha_gov,
    cnpj,
    tipo_negocio,
    possui_socio,
    tipo_divida,
    valor_divida_municipal,
    valor_divida_estadual,
    valor_divida_federal,
    valor_divida_ativa,
    faturamento_mensal,
    observacoes,
    teria_interesse,
    calculo_parcelamento,
  } = body;

  try {
    await client.connect();

    // Update query
    // We only update fields that are provided
    const updateQuery = `
      UPDATE haylander
      SET 
        email = $1,
        senha_gov = $2,
        cnpj = $3,
        "tipo_negócio" = $4,
        "possui_sócio" = $5,
        tipo_divida = $6,
        valor_divida_municipal = $7,
        valor_divida_estadual = $8,
        valor_divida_federal = $9,
        valor_divida_ativa = $10,
        faturamento_mensal = $11,
        observacoes = $12,
        "teria_interesse?" = $13,
        calculo_parcelamento = $14,
        envio_disparo = 'a1',
        data_controle_24h = NOW() + INTERVAL '24 hours',
        atualizado_em = NOW()
      WHERE telefone = $15
      RETURNING *
    `;

    const values = [
      email || null,
      senha_gov || null,
      cnpj || null,
      tipo_negocio || null,
      possui_socio === "Sim", // Boolean
      tipo_divida || null,
      valor_divida_municipal || null,
      valor_divida_estadual || null,
      valor_divida_federal || null,
      valor_divida_ativa || null,
      faturamento_mensal || null,
      observacoes || null,
      teria_interesse || null,
      calculo_parcelamento || null,
      phone,
    ];

    const res = await client.query(updateQuery, values);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
