import { NextResponse } from "next/server";
import { Client } from "pg";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database connection not configured" },
        { status: 500 },
      );
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    // WHERE criteria
    const column: string | undefined = body?.where?.column ?? body.column;
    const operator: "in" | "not_in" | "is_empty" | "is_not_empty" | undefined =
      body?.where?.operator ?? body.operator;
    const values: string[] = Array.isArray(body?.where?.values ?? body.values)
      ? (body?.where?.values ?? body.values)
      : [];

    // UPDATE target
    const updateColumn: string | undefined =
      body?.update?.column ?? body.updateColumn ?? column;
    const updateAction:
      | "set_value"
      | "set_empty"
      | "toggle_boolean"
      | undefined =
      body?.update?.action ??
      body.updateAction ??
      (body?.update?.empty ? "set_empty" : "set_value");
    const updateValueRaw: unknown = body?.update?.value ?? body.updateValue;

    // Map columns to tables and fully qualified names
    const columnTableMap: Record<string, string> = {
      // leads (core)
      telefone: "leads",
      nome_completo: "leads",
      email: "leads",
      atualizado_em: "leads",
      data_cadastro: "leads",

      // leads_empresarial
      cnpj: "leads_empresarial",
      razao_social: "leads_empresarial",
      tipo_negocio: "leads_empresarial",
      faturamento_mensal: "leads_empresarial",
      cartao_cnpj: "leads_empresarial",

      // leads_qualificacao
      situacao: "leads_qualificacao",
      qualificacao: "leads_qualificacao",
      motivo_qualificacao: "leads_qualificacao",
      interesse_ajuda: "leads_qualificacao",
      pos_qualificacao: "leads_qualificacao",
      possui_socio: "leads_qualificacao",

      // leads_financeiro
      calculo_parcelamento: "leads_financeiro",
      valor_divida_ativa: "leads_financeiro",
      valor_divida_municipal: "leads_financeiro",
      valor_divida_estadual: "leads_financeiro",
      valor_divida_federal: "leads_financeiro",
      tipo_divida: "leads_financeiro",

      // leads_vendas
      servico_negociado: "leads_vendas",
      procuracao: "leads_vendas",
      data_reuniao: "leads_vendas",

      // leads_atendimento
      observacoes: "leads_atendimento",
      data_controle_24h: "leads_atendimento",
      envio_disparo: "leads_atendimento",
      data_ultima_consulta: "leads_atendimento",

      // Legacy/Aliases
      teria_interesse: "leads_qualificacao", // -> interesse_ajuda
      servico_escolhido: "leads_vendas", // -> servico_negociado
      reuniao_agendada: "leads_vendas", // -> ? (assuming mapped or ignored)
      vendido: "leads_vendas", // -> ?
      confirmacao_qualificacao: "leads_qualificacao", // -> ?
    };

    const columnRealNameMap: Record<string, string> = {
      teria_interesse: "interesse_ajuda",
      servico_escolhido: "servico_negociado",
    };

    const allowedUpdateColumns: Record<
      string,
      { col: string; type: "text" | "boolean" | "timestamp" }
    > = {
      telefone: { col: "telefone", type: "text" },
      nome_completo: { col: "nome_completo", type: "text" },
      razao_social: { col: "razao_social", type: "text" },
      cnpj: { col: "cnpj", type: "text" },
      email: { col: "email", type: "text" },
      observacoes: { col: "observacoes", type: "text" },
      calculo_parcelamento: { col: "calculo_parcelamento", type: "text" },
      atualizado_em: { col: "updated_at", type: "timestamp" }, // Standardized
      data_cadastro: { col: "data_cadastro", type: "timestamp" },
      data_controle_24h: { col: "data_controle_24h", type: "timestamp" },
      envio_disparo: { col: "envio_disparo", type: "text" },
      situacao: { col: "situacao", type: "text" },
      qualificacao: { col: "qualificacao", type: "text" },
      motivo_qualificacao: { col: "motivo_qualificacao", type: "text" },
      interesse_ajuda: { col: "interesse_ajuda", type: "text" },
      valor_divida_ativa: { col: "valor_divida_ativa", type: "text" },
      valor_divida_municipal: { col: "valor_divida_municipal", type: "text" },
      valor_divida_estadual: { col: "valor_divida_estadual", type: "text" },
      valor_divida_federal: { col: "valor_divida_federal", type: "text" },
      cartao_cnpj: { col: "cartao_cnpj", type: "text" },
      tipo_divida: { col: "tipo_divida", type: "text" },
      tipo_negocio: { col: "tipo_negocio", type: "text" },
      faturamento_mensal: { col: "faturamento_mensal", type: "text" },
      possui_socio: { col: "possui_socio", type: "boolean" },
      pos_qualificacao: { col: "pos_qualificacao", type: "boolean" },
      servico_negociado: { col: "servico_negociado", type: "text" },
      data_ultima_consulta: { col: "data_ultima_consulta", type: "timestamp" },
      procuracao: { col: "procuracao", type: "boolean" },
      // Legacy
      teria_interesse: { col: "interesse_ajuda", type: "text" },
      servico_escolhido: { col: "servico_negociado", type: "text" },
      data_reuniao: { col: "data_reuniao", type: "timestamp" },
    };

    if (!column || !operator) {
      await client.end();
      return NextResponse.json(
        { error: "where.column e where.operator são obrigatórios" },
        { status: 400 },
      );
    }

    // Determine tables
    const whereTableName = columnTableMap[column] || "leads"; // Default to leads if not found (legacy behavior safety)
    const whereColReal = columnRealNameMap[column] || column;

    const updateTableName = columnTableMap[updateColumn!];
    if (!updateTableName) {
      await client.end();
      return NextResponse.json(
        { error: "Coluna de atualização inválida ou não mapeada" },
        { status: 400 },
      );
    }

    const dbUpdate = allowedUpdateColumns[updateColumn!];
    if (!dbUpdate) {
      await client.end();
      return NextResponse.json(
        { error: "Coluna de atualização não permitida" },
        { status: 400 },
      );
    }

    // Aliases
    const tableAliasMap: Record<string, string> = {
      leads: "l",
      leads_empresarial: "le",
      leads_qualificacao: "lq",
      leads_financeiro: "lf",
      leads_vendas: "lv",
      leads_atendimento: "la",
    };
    const targetAlias = tableAliasMap[updateTableName];
    const whereAlias = tableAliasMap[whereTableName];

    // Construct SET clause
    let setSql = "";
    const params: Array<string | string[]> = [];

    if (updateAction === "set_empty") {
      setSql = `SET ${dbUpdate.col} = NULL`;
    } else if (updateAction === "toggle_boolean") {
      if (dbUpdate.type !== "boolean") {
        await client.end();
        return NextResponse.json(
          { error: "Toggle booleano só é válido para colunas booleanas" },
          { status: 400 },
        );
      }
      setSql = `SET ${dbUpdate.col} = NOT COALESCE(${targetAlias}.${dbUpdate.col}::boolean, FALSE)`;
    } else {
      // set_value
      if (typeof updateValueRaw === "undefined" || updateValueRaw === null) {
        await client.end();
        return NextResponse.json(
          { error: "Informe o novo valor para set_value" },
          { status: 400 },
        );
      }
      setSql = `SET ${dbUpdate.col} = $1${
        dbUpdate.type === "boolean"
          ? "::boolean"
          : dbUpdate.type === "timestamp"
            ? "::timestamp"
            : ""
      }`;
      params.push(String(updateValueRaw));
    }

    // Always update updated_at if it exists (it exists in all our new tables)
    setSql += `, updated_at = NOW()`;

    // Construct WHERE clause
    let whereSql = "";
    let whereParams: string[][] = [];

    // Use fully qualified name for WHERE column
    const whereColQualified = `${whereAlias}.${whereColReal}`;

    switch (operator) {
      case "in":
        whereSql = `${whereColQualified}::text = ANY($${params.length + 1})`;
        whereParams = [values];
        break;
      case "not_in":
        whereSql = `NOT (${whereColQualified}::text = ANY($${params.length + 1})) OR ${whereColQualified} IS NULL`;
        whereParams = [values];
        break;
      case "is_empty":
        whereSql = `${whereColQualified} IS NULL OR ${whereColQualified}::text = ''`;
        break;
      case "is_not_empty":
        whereSql = `${whereColQualified} IS NOT NULL AND ${whereColQualified}::text <> ''`;
        break;
      default:
        await client.end();
        return NextResponse.json(
          { error: "Operador inválido" },
          { status: 400 },
        );
    }

    // Optimized Query Construction
    // Only join the necessary tables to avoid implicit inner join filtering

    let sql = "";

    // Case 1: Filter and Update are on the same table
    if (updateTableName === whereTableName) {
      sql = `
            UPDATE ${updateTableName} ${targetAlias}
            ${setSql}
            WHERE ${whereSql}
        `;
    } else {
      // Case 2: Different tables, need to join
      // We use FROM clause to join the 'where' table

      // Resolve join condition based on table types (leads vs satellite)
      let joinCondition = "";

      if (updateTableName === "leads") {
        // Target is leads (id), Source is satellite (lead_id)
        joinCondition = `${targetAlias}.id = ${whereAlias}.lead_id`;
      } else if (whereTableName === "leads") {
        // Target is satellite (lead_id), Source is leads (id)
        joinCondition = `${targetAlias}.lead_id = ${whereAlias}.id`;
      } else {
        // Both are satellites (lead_id)
        joinCondition = `${targetAlias}.lead_id = ${whereAlias}.lead_id`;
      }

      sql = `
            UPDATE ${updateTableName} ${targetAlias}
            ${setSql}
            FROM ${whereTableName} ${whereAlias}
            WHERE ${joinCondition}
            AND ${whereSql}
        `;
    }

    const res = await client.query(sql, [...params, ...whereParams]);
    await client.end();

    revalidatePath("/admin/lista");

    return NextResponse.json({ success: true, updated: res.rowCount });
  } catch (error: unknown) {
    console.error("Bulk update error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar em massa";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
