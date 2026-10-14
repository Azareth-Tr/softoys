export interface Juguete {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  categoria_id: string;
  rango_edad: string | null;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  imagen_url: string | null;
  creado_en: string;
  actualizado_en: string;
}
