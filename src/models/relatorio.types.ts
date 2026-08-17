export interface IRelatorio {
    total_clientes: number
    total_animais: number
    total_servicos: number
    total_cancelamentos: number
    total_faltas: number
}

export interface ICreateRelatorioDTO {
   total_clientes: number
    total_animais: number
    total_servicos: number
    total_cancelamentos: number
    total_faltas: number
}

export interface IUpdateRelatorioDTO  {
    total_clientes?: number
    total_animais?: number
    total_servicos?: number
    total_cancelamentos?: number
    total_faltas?: number
}
