import { supabase } from "@/lib/supabase";
import type { Categoria } from "@/models/Categoria";

export type CrearCategoria = Pick<Categoria, "nombre" | "codigo"> &
  Partial<Pick<Categoria, "id" | "descripcion" | "creado_en">>;

export type ActualizarCategoria = Partial<
  Pick<Categoria, "nombre" | "descripcion" | "codigo">
>;

const campos = "id, nombre, descripcion, codigo, creado_en";

function validarCampos(datos: CrearCategoria | ActualizarCategoria): void {
  if (datos.nombre !== undefined && !datos.nombre.trim()) {
    throw new Error("El nombre de la categoria es obligatorio.");
  }
  if (datos.codigo !== undefined && !datos.codigo.trim()) {
    throw new Error("El codigo de la categoria es obligatorio.");
  }
}

function validarId(id: string): void {
  if (!id.trim()) {
    throw new Error("El id de la categoria es obligatorio.");
  }
}

export const categoriaController = {
  async obtenerTodas(): Promise<Categoria[]> {
    const { data, error } = await supabase
      .from("categorias")
      .select(campos)
      .order("nombre")
      .returns<Categoria[]>();

    if (error) throw error;
    return data ?? [];
  },

  async obtenerPorId(id: string): Promise<Categoria | null> {
    validarId(id);
    const { data, error } = await supabase
      .from("categorias")
      .select(campos)
      .eq("id", id)
      .maybeSingle<Categoria>();

    if (error) throw error;
    return data;
  },

  async crear(datos: CrearCategoria): Promise<Categoria> {
    validarCampos(datos);
    const { data, error } = await supabase
      .from("categorias")
      .insert({
        ...(datos.id !== undefined ? { id: datos.id } : {}),
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion ?? null,
        codigo: datos.codigo.trim(),
        ...(datos.creado_en !== undefined ? { creado_en: datos.creado_en } : {}),
      })
      .select(campos)
      .single<Categoria>();

    if (error) throw error;
    return data;
  },

  async actualizar(id: string, datos: ActualizarCategoria): Promise<Categoria> {
    validarId(id);
    validarCampos(datos);
    const cambios: ActualizarCategoria = {};
    if (datos.nombre !== undefined) cambios.nombre = datos.nombre.trim();
    if (datos.descripcion !== undefined) cambios.descripcion = datos.descripcion;
    if (datos.codigo !== undefined) cambios.codigo = datos.codigo.trim();
    if (Object.keys(cambios).length === 0) {
      throw new Error("Debes indicar al menos un campo para actualizar.");
    }

    const { data, error } = await supabase
      .from("categorias")
      .update(cambios)
      .eq("id", id)
      .select(campos)
      .single<Categoria>();

    if (error) throw error;
    return data;
  },

  async eliminar(id: string): Promise<Categoria> {
    validarId(id);
    const { data, error } = await supabase
      .from("categorias")
      .delete()
      .eq("id", id)
      .select(campos)
      .single<Categoria>();

    if (error) throw error;
    return data;
  },
};
