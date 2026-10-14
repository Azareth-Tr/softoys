import { supabase } from "@/lib/supabase";
import type { Juguete } from "@/models/Juguete";

type CamposJuguete = Omit<Juguete, "id" | "creado_en" | "actualizado_en">;
export type CrearJuguete = Omit<CamposJuguete, "descripcion" | "rango_edad" | "imagen_url"> &
  Partial<Pick<Juguete, "id" | "descripcion" | "rango_edad" | "imagen_url" | "creado_en" | "actualizado_en">>;
export type ActualizarJuguete = Partial<CamposJuguete>;

const campos = "id, sku, nombre, descripcion, categoria_id, rango_edad, precio_compra, precio_venta, stock_actual, stock_minimo, activo, imagen_url, creado_en, actualizado_en";

function validarId(id: string): void {
  if (!id.trim()) throw new Error("El id del juguete es obligatorio.");
}

function prepararCampos(datos: ActualizarJuguete): ActualizarJuguete {
  const cambios: ActualizarJuguete = {};
  for (const campo of ["sku", "nombre", "categoria_id"] as const) {
    if (datos[campo] !== undefined) {
      const valor = datos[campo].trim();
      if (!valor) throw new Error(`El campo ${campo} es obligatorio.`);
      cambios[campo] = valor;
    }
  }
  for (const campo of ["descripcion", "rango_edad", "imagen_url"] as const) {
    if (datos[campo] !== undefined) cambios[campo] = datos[campo];
  }
  for (const campo of ["precio_compra", "precio_venta", "stock_actual", "stock_minimo"] as const) {
    const valor = datos[campo];
    if (valor !== undefined) {
      if (!Number.isFinite(valor) || valor < 0) {
        throw new Error(`El campo ${campo} debe ser un numero mayor o igual a cero.`);
      }
      if ((campo === "stock_actual" || campo === "stock_minimo") && !Number.isInteger(valor)) {
        throw new Error(`El campo ${campo} debe ser un numero entero.`);
      }
      cambios[campo] = valor;
    }
  }
  if (datos.activo !== undefined) {
    if (typeof datos.activo !== "boolean") throw new Error("El campo activo debe ser booleano.");
    cambios.activo = datos.activo;
  }
  return cambios;
}

export const jugueteController = {
  async obtenerTodos(): Promise<Juguete[]> {
    const { data, error } = await supabase
      .from("productos")
      .select(campos)
      .eq("activo", true)
      .order("nombre")
      .returns<Juguete[]>();
    if (error) throw error;
    return data ?? [];
  },

  async obtenerPorId(id: string): Promise<Juguete | null> {
    validarId(id);
    const { data, error } = await supabase
      .from("productos")
      .select(campos)
      .eq("id", id)
      .maybeSingle<Juguete>();
    if (error) throw error;
    return data;
  },

  async crear(datos: CrearJuguete): Promise<Juguete> {
    const cambios = prepararCampos(datos);
    for (const campo of ["sku", "nombre", "categoria_id", "precio_compra", "precio_venta", "stock_actual", "stock_minimo", "activo"] as const) {
      if (cambios[campo] === undefined) throw new Error(`El campo ${campo} es obligatorio.`);
    }
    cambios.descripcion ??= null;
    cambios.rango_edad ??= null;
    cambios.imagen_url ??= null;
    if (datos.id !== undefined) validarId(datos.id);
    const { data, error } = await supabase
      .from("productos")
      .insert({
        ...cambios,
        ...(datos.id !== undefined ? { id: datos.id } : {}),
        ...(datos.creado_en !== undefined ? { creado_en: datos.creado_en } : {}),
        ...(datos.actualizado_en !== undefined ? { actualizado_en: datos.actualizado_en } : {}),
      })
      .select(campos)
      .single<Juguete>();
    if (error) throw error;
    return data;
  },

  async actualizar(id: string, datos: ActualizarJuguete): Promise<Juguete> {
    validarId(id);
    const cambios = prepararCampos(datos);
    if (Object.keys(cambios).length === 0) {
      throw new Error("Debes indicar al menos un campo para actualizar.");
    }
    const { data, error } = await supabase
      .from("productos")
      .update({ ...cambios, actualizado_en: new Date().toISOString() })
      .eq("id", id)
      .select(campos)
      .single<Juguete>();
    if (error) throw error;
    return data;
  },

  async eliminar(id: string): Promise<Juguete> {
    validarId(id);
    const { data, error } = await supabase
      .from("productos")
      .delete()
      .eq("id", id)
      .select(campos)
      .single<Juguete>();
    if (error) throw error;
    return data;
  },
};
