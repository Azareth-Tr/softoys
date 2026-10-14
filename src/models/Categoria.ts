export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  codigo: string;
  /** Fecha de creacion serializada como texto por Supabase. */
  creado_en: string;
  
}
