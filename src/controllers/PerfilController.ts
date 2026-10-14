import { supabase } from "@/lib/supabase";
import type { Perfil } from "@/models/Perfil";

export type CrearPerfil = Pick<Perfil, "correo" | "nombre_completo" | "rol"> &
  Partial<Pick<Perfil, "id" | "creado_en" | "actualizado_en">>;
export type ActualizarPerfil = Partial<Pick<Perfil, "correo" | "nombre_completo" | "rol">>;

const campos = "id, correo, nombre_completo, rol, creado_en, actualizado_en";

function validarId(id: string): void {
  if (!id.trim()) throw new Error("El id del perfil es obligatorio.");
}

function prepararCampos(datos: ActualizarPerfil): ActualizarPerfil {
  const cambios: ActualizarPerfil = {};
  for (const campo of ["correo", "nombre_completo", "rol"] as const) {
    if (datos[campo] !== undefined) {
      const valor = datos[campo].trim();
      if (!valor) throw new Error(`El campo ${campo} es obligatorio.`);
      cambios[campo] = valor;
    }
  }
  if (cambios.correo !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cambios.correo)) {
    throw new Error("El correo no tiene un formato valido.");
  }
  return cambios;
}

export const perfilController = {
  async obtenerTodos(): Promise<Perfil[]> {
    const { data, error } = await supabase
      .from("perfiles")
      .select(campos)
      .order("nombre_completo")
      .returns<Perfil[]>();
    if (error) throw error;
    return data ?? [];
  },

  async obtenerPorId(id: string): Promise<Perfil | null> {
    validarId(id);
    const { data, error } = await supabase
      .from("perfiles")
      .select(campos)
      .eq("id", id)
      .maybeSingle<Perfil>();
    if (error) throw error;
    return data;
  },

  async crear(datos: CrearPerfil): Promise<Perfil> {
    const cambios = prepararCampos(datos);
    for (const campo of ["correo", "nombre_completo", "rol"] as const) {
      if (cambios[campo] === undefined) throw new Error(`El campo ${campo} es obligatorio.`);
    }
    if (datos.id !== undefined) validarId(datos.id);
    const { data, error } = await supabase
      .from("perfiles")
      .insert({
        ...cambios,
        ...(datos.id !== undefined ? { id: datos.id } : {}),
        ...(datos.creado_en !== undefined ? { creado_en: datos.creado_en } : {}),
        ...(datos.actualizado_en !== undefined ? { actualizado_en: datos.actualizado_en } : {}),
      })
      .select(campos)
      .single<Perfil>();
    if (error) throw error;
    return data;
  },

  async actualizar(id: string, datos: ActualizarPerfil): Promise<Perfil> {
    validarId(id);
    const cambios = prepararCampos(datos);
    if (Object.keys(cambios).length === 0) {
      throw new Error("Debes indicar al menos un campo para actualizar.");
    }
    const { data, error } = await supabase
      .from("perfiles")
      .update({ ...cambios, actualizado_en: new Date().toISOString() })
      .eq("id", id)
      .select(campos)
      .single<Perfil>();
    if (error) throw error;
    return data;
  },

  async eliminar(id: string): Promise<Perfil> {
    validarId(id);
    const { data, error } = await supabase
      .from("perfiles")
      .delete()
      .eq("id", id)
      .select(campos)
      .single<Perfil>();
    if (error) throw error;
    return data;
  },
};
