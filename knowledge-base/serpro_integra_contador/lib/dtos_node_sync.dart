import 'package:json_annotation/json_annotation.dart';

part 'dtos_node_sync.g.dart';

/// DTO Base de Requisição (Node.js -> Serpro Gateway)
/// Essa estrutura reflete como a API local em Next.js / Express 
/// recebe a requisição antes de envelopar para o pacote Serpro real.
@JsonSerializable()
class SerproConsultaRequestNodeDTO {
  final String cnpj;
  final String service; // ex: 'PGMEI', 'DIVIDA_ATIVA', 'SIT_FISCAL'
  
  // Parâmetros opcionais formatados pela IA ou Frontend Mobile
  final String? ano;
  final String? mes;
  final String? numeroRecibo;
  final String? codigoReceita;
  final String? categoria;
  final String? numeroDas;
  final String? parcelaParaEmitir;

  SerproConsultaRequestNodeDTO({
    required this.cnpj,
    required this.service,
    this.ano,
    this.mes,
    this.numeroRecibo,
    this.codigoReceita,
    this.categoria,
    this.numeroDas,
    this.parcelaParaEmitir,
  });

  factory SerproConsultaRequestNodeDTO.fromJson(Map<String, dynamic> json) => _$SerproConsultaRequestNodeDTOFromJson(json);
  Map<String, dynamic> toJson() => _$SerproConsultaRequestNodeDTOToJson(this);
}

/// DTO de Resposta Consolidada e simplificada do nosso BFF Node
@JsonSerializable()
class SerproConsultaResponseNodeDTO {
  final int status;
  final bool sucesso;
  final dynamic dados;
  final String? mensagemErro;

  SerproConsultaResponseNodeDTO({
    required this.status,
    required this.sucesso,
    this.dados,
    this.mensagemErro,
  });

  factory SerproConsultaResponseNodeDTO.fromJson(Map<String, dynamic> json) => _$SerproConsultaResponseNodeDTOFromJson(json);
  Map<String, dynamic> toJson() => _$SerproConsultaResponseNodeDTOToJson(this);
}
