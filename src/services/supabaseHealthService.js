import {
  supabase,
  supabaseEnvironment,
} from '../js/supabase.js';

export async function checkSupabaseHealth() {
  if (!supabaseEnvironment.isValid || !supabase) {
    return {
      ok: false,
      environment: supabaseEnvironment,
      apiReachable: false,
      error:
        supabaseEnvironment.errors.join(' ') ||
        'Não foi possível inicializar o cliente Supabase.',
    };
  }

  try {
    // Esta leitura é propositalmente simples.
    // Com o usuário ainda deslogado, o RLS pode retornar zero registros.
    // O importante nesta etapa é a API responder sem erro.
    const { error } = await supabase
      .from('area_types')
      .select('id')
      .limit(1);

    if (error) {
      return {
        ok: false,
        environment: supabaseEnvironment,
        apiReachable: false,
        error: error.message,
      };
    }

    return {
      ok: true,
      environment: supabaseEnvironment,
      apiReachable: true,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      environment: supabaseEnvironment,
      apiReachable: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro inesperado ao testar o Supabase.',
    };
  }
}
