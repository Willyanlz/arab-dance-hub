export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      form_config: {
        Row: {
          created_at: string
          fields: Json
          id: string
          tipo_inscricao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fields?: Json
          id?: string
          tipo_inscricao: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          tipo_inscricao?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingressos_vendidos: {
        Row: {
          cpf: string
          created_at: string
          email: string
          id: string
          nome_comprador: string
          quantidade: number
          status: string
          telefone: string | null
          tipo_ingresso_id: string
          updated_at: string
          user_id: string | null
          valor_total: number
        }
        Insert: {
          cpf: string
          created_at?: string
          email: string
          id?: string
          nome_comprador: string
          quantidade?: number
          status?: string
          telefone?: string | null
          tipo_ingresso_id: string
          updated_at?: string
          user_id?: string | null
          valor_total: number
        }
        Update: {
          cpf?: string
          created_at?: string
          email?: string
          id?: string
          nome_comprador?: string
          quantidade?: number
          status?: string
          telefone?: string | null
          tipo_ingresso_id?: string
          updated_at?: string
          user_id?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingressos_vendidos_tipo_ingresso_id_fkey"
            columns: ["tipo_ingresso_id"]
            isOneToOne: false
            referencedRelation: "tipos_ingresso"
            referencedColumns: ["id"]
          },
        ]
      }
      inscricao_workshops: {
        Row: {
          created_at: string
          id: string
          inscricao_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inscricao_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inscricao_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscricao_workshops_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "inscricoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscricao_workshops_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops_config"
            referencedColumns: ["id"]
          },
        ]
      }
      inscricoes: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_tipo"]
          como_soube: string | null
          created_at: string
          desconto_percentual: number | null
          faixa_etaria: string | null
          id: string
          lote_id: string | null
          lote_mostra_id: string | null
          lote_workshop_id: string | null
          modalidade: string
          nome_artistico: string | null
          nome_coreografia: string
          nome_escola: string | null
          num_integrantes: number | null
          observacoes: string | null
          participa_harem: boolean | null
          periodo: Database["public"]["Enums"]["periodo_tipo"]
          preferencia_periodo: string | null
          professora: string | null
          status: Database["public"]["Enums"]["status_inscricao"]
          sugestao_horario: string | null
          termos_atraso: boolean | null
          termos_musica: boolean | null
          termos_sem_ensaio: boolean | null
          tipo_compra_workshop: string | null
          tipo_inscricao: string | null
          tipo_musica: Database["public"]["Enums"]["musica_tipo"]
          tipo_participacao_mostra: string | null
          updated_at: string
          user_id: string
          valor_final: number | null
          valor_total: number | null
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_tipo"]
          como_soube?: string | null
          created_at?: string
          desconto_percentual?: number | null
          faixa_etaria?: string | null
          id?: string
          lote_id?: string | null
          lote_mostra_id?: string | null
          lote_workshop_id?: string | null
          modalidade: string
          nome_artistico?: string | null
          nome_coreografia: string
          nome_escola?: string | null
          num_integrantes?: number | null
          observacoes?: string | null
          participa_harem?: boolean | null
          periodo?: Database["public"]["Enums"]["periodo_tipo"]
          preferencia_periodo?: string | null
          professora?: string | null
          status?: Database["public"]["Enums"]["status_inscricao"]
          sugestao_horario?: string | null
          termos_atraso?: boolean | null
          termos_musica?: boolean | null
          termos_sem_ensaio?: boolean | null
          tipo_compra_workshop?: string | null
          tipo_inscricao?: string | null
          tipo_musica?: Database["public"]["Enums"]["musica_tipo"]
          tipo_participacao_mostra?: string | null
          updated_at?: string
          user_id: string
          valor_final?: number | null
          valor_total?: number | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_tipo"]
          como_soube?: string | null
          created_at?: string
          desconto_percentual?: number | null
          faixa_etaria?: string | null
          id?: string
          lote_id?: string | null
          lote_mostra_id?: string | null
          lote_workshop_id?: string | null
          modalidade?: string
          nome_artistico?: string | null
          nome_coreografia?: string
          nome_escola?: string | null
          num_integrantes?: number | null
          observacoes?: string | null
          participa_harem?: boolean | null
          periodo?: Database["public"]["Enums"]["periodo_tipo"]
          preferencia_periodo?: string | null
          professora?: string | null
          status?: Database["public"]["Enums"]["status_inscricao"]
          sugestao_horario?: string | null
          termos_atraso?: boolean | null
          termos_musica?: boolean | null
          termos_sem_ensaio?: boolean | null
          tipo_compra_workshop?: string | null
          tipo_inscricao?: string | null
          tipo_musica?: Database["public"]["Enums"]["musica_tipo"]
          tipo_participacao_mostra?: string | null
          updated_at?: string
          user_id?: string
          valor_final?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inscricoes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscricoes_lote_mostra_id_fkey"
            columns: ["lote_mostra_id"]
            isOneToOne: false
            referencedRelation: "lotes_mostra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscricoes_lote_workshop_id_fkey"
            columns: ["lote_workshop_id"]
            isOneToOne: false
            referencedRelation: "lotes_workshop"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes: {
        Row: {
          ativo: boolean | null
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          nome: string
          numero: number
          preco_dupla_trio: number
          preco_grupo_por_integrante: number
          preco_solo: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          nome: string
          numero: number
          preco_dupla_trio: number
          preco_grupo_por_integrante: number
          preco_solo: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          nome?: string
          numero?: number
          preco_dupla_trio?: number
          preco_grupo_por_integrante?: number
          preco_solo?: number
        }
        Relationships: []
      }
      lotes_ingresso: {
        Row: {
          ativo: boolean | null
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          nome: string
          numero: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          nome: string
          numero: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          nome?: string
          numero?: number
        }
        Relationships: []
      }
      lotes_mostra: {
        Row: {
          ativo: boolean | null
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          nome: string
          numero: number
          preco_dupla_trio: number
          preco_grupo_por_integrante: number
          preco_solo: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          nome: string
          numero: number
          preco_dupla_trio: number
          preco_grupo_por_integrante: number
          preco_solo: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          nome?: string
          numero?: number
          preco_dupla_trio?: number
          preco_grupo_por_integrante?: number
          preco_solo?: number
        }
        Relationships: []
      }
      lotes_workshop: {
        Row: {
          ativo: boolean | null
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          nome: string
          numero: number
          preco_1_aula: number
          preco_2_aulas: number
          preco_3_aulas: number
          preco_4_aulas: number
          preco_5_aulas: number
          preco_pacote_completo: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          nome: string
          numero: number
          preco_1_aula: number
          preco_2_aulas: number
          preco_3_aulas: number
          preco_4_aulas: number
          preco_5_aulas: number
          preco_pacote_completo: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          nome?: string
          numero?: number
          preco_1_aula?: number
          preco_2_aulas?: number
          preco_3_aulas?: number
          preco_4_aulas?: number
          preco_5_aulas?: number
          preco_pacote_completo?: number
        }
        Relationships: []
      }
      modalidades_config: {
        Row: {
          ativo: boolean | null
          created_at: string
          faixa_etaria: string | null
          horario: string | null
          id: string
          nome: string
          ordem: number | null
          periodo: string
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          faixa_etaria?: string | null
          horario?: string | null
          id?: string
          nome: string
          ordem?: number | null
          periodo?: string
          tipo?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          faixa_etaria?: string | null
          horario?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          periodo?: string
          tipo?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          comprovante_url: string | null
          created_at: string
          id: string
          inscricao_id: string
          metodo: Database["public"]["Enums"]["pagamento_metodo"]
          status: Database["public"]["Enums"]["status_inscricao"]
          updated_at: string
          valor: number
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          id?: string
          inscricao_id: string
          metodo: Database["public"]["Enums"]["pagamento_metodo"]
          status?: Database["public"]["Enums"]["status_inscricao"]
          updated_at?: string
          valor: number
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          id?: string
          inscricao_id?: string
          metodo?: Database["public"]["Enums"]["pagamento_metodo"]
          status?: Database["public"]["Enums"]["status_inscricao"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "inscricoes"
            referencedColumns: ["id"]
          },
        ]
      }
      participantes: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          inscricao_id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          inscricao_id: string
          nome: string
          telefone?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          inscricao_id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participantes_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "inscricoes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string
          created_at: string
          email: string
          id: string
          is_aluna_jalilete: boolean | null
          nome: string
          participante_anterior: boolean | null
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf?: string
          created_at?: string
          email?: string
          id?: string
          is_aluna_jalilete?: boolean | null
          nome?: string
          participante_anterior?: boolean | null
          telefone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf?: string
          created_at?: string
          email?: string
          id?: string
          is_aluna_jalilete?: boolean | null
          nome?: string
          participante_anterior?: boolean | null
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          chave: string
          created_at: string
          descricao: string | null
          id: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: Json
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      termos_config: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          conteudo?: string
          created_at?: string
          id?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_ingresso: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          lote_ingresso_id: string | null
          nome: string
          preco: number
          quantidade_total: number
          quantidade_vendida: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          lote_ingresso_id?: string | null
          nome: string
          preco?: number
          quantidade_total?: number
          quantidade_vendida?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          lote_ingresso_id?: string | null
          nome?: string
          preco?: number
          quantidade_total?: number
          quantidade_vendida?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_ingresso_lote_ingresso_id_fkey"
            columns: ["lote_ingresso_id"]
            isOneToOne: false
            referencedRelation: "lotes_ingresso"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workshops_config: {
        Row: {
          ativo: boolean | null
          created_at: string
          horario: string | null
          id: string
          nome: string
          periodo: string | null
          professor: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          horario?: string | null
          id?: string
          nome: string
          periodo?: string | null
          professor?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          horario?: string | null
          id?: string
          nome?: string
          periodo?: string | null
          professor?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      categoria_tipo: "solo" | "dupla_trio" | "grupo"
      musica_tipo: "solta" | "posicionada"
      pagamento_metodo: "pix" | "cartao"
      periodo_tipo: "manha" | "tarde" | "nao_competir"
      status_inscricao: "pendente" | "pago" | "confirmado" | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      categoria_tipo: ["solo", "dupla_trio", "grupo"],
      musica_tipo: ["solta", "posicionada"],
      pagamento_metodo: ["pix", "cartao"],
      periodo_tipo: ["manha", "tarde", "nao_competir"],
      status_inscricao: ["pendente", "pago", "confirmado", "cancelado"],
    },
  },
} as const
