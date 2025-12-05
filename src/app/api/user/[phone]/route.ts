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
  } = body;

  try {
    await client.connect();

    // Update query
    // We only update fields that are provided
    const updateQuery = `
      UPDATE haylander
      SET 
        cnpj = $1,
        "tipo_negócio" = $2,
        "possui_sócio" = $3,
        tipo_divida = $4,
        valor_divida_municipal = COALESCE($5, valor_divida_municipal),
        valor_divida_estadual = COALESCE($6, valor_divida_estadual),
        valor_divida_federal = COALESCE($7, valor_divida_federal),
        valor_divida_ativa = COALESCE($8, valor_divida_ativa),
        faturamento_mensal = $9,
        observacoes = $10,
        "teria_interesse?" = $11,
        envio_disparo = 'a1',
        data_controle_24h = NOW() + INTERVAL '24 hours',
        atualizado_em = NOW()
      WHERE telefone = $12
      RETURNING *
    `;

    const values = [
      cnpj,
      tipo_negocio,
      possui_socio === "Sim", // Convert "Sim"/"Não" to boolean if needed, or strictly boolean. Database says boolean.
      tipo_divida,
      valor_divida_municipal,
      valor_divida_estadual,
      valor_divida_federal,
      valor_divida_ativa,
      faturamento_mensal,
      observacoes,
      teria_interesse,
      phone,
    ];

    const res = await client.query(updateQuery, values);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
