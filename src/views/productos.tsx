"use client";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Juguete } from "@/models/Juguete";
import type { Categoria } from "@/models/Categoria";
import s from "./productos.module.css";
const dinero = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const normalizar = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const estado = (p: Juguete) => p.stock_actual === 0 ? "agotado" : p.stock_actual <= p.stock_minimo ? "bajo" : "disponible";
const nombres = { agotado: "Agotado", bajo: "Stock bajo", disponible: "En stock" };
function Icono({ tipo = "caja" }: { tipo?: "caja" | "buscar" | "ojo" | "vacio" }) {
 return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{tipo === "caja" ? <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/></> : tipo === "ojo" ? <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></> : <><circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/>{tipo === "vacio" && <path d="m7 7 6 6m0-6-6 6"/>}</>}</svg>;
}
function Estado({ producto }: { producto: Juguete }) { const e = estado(producto); return <span className={[s.badge,s[e]].join(" ")}>● {nombres[e]}</span>; }
function Modal({ titulo, cerrar, children }: { titulo: string; cerrar: () => void; children: ReactNode }) {
 const ref = useRef<HTMLDialogElement>(null);
 useEffect(() => { const dialog = ref.current; const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null; dialog?.showModal(); return () => { dialog?.close(); previo?.focus(); }; }, []);
 return <dialog ref={ref} className={s.modal} aria-labelledby="titulo-modal" onCancel={e => { e.preventDefault(); cerrar(); }} onClick={e => { if(e.target === e.currentTarget) cerrar(); }}><div className={s.modalHeading}><h2 id="titulo-modal">{titulo}</h2><button type="button" className={s.close} onClick={cerrar} aria-label="Cerrar">×</button></div>{children}</dialog>;
}
export default function Productos() {
 const [productos,setProductos] = useState<Juguete[]>([]);
 const [categorias,setCategorias] = useState<Categoria[]>([]);
 const [busqueda,setBusqueda] = useState("");
 const [categoria,setCategoria] = useState("");
 const [stock,setStock] = useState("");
 const [cargando,setCargando] = useState(true);
 const [error,setError] = useState("");
 const [detalle,setDetalle] = useState<Juguete|null>(null);
 const [nuevo,setNuevo] = useState(false);
 const [porEliminar,setPorEliminar] = useState<Juguete|null>(null);
 const [eliminando,setEliminando] = useState(false);
 const [errorEliminar,setErrorEliminar] = useState("");
 const eliminacionEnCurso = useRef(false);
 const [guardando,setGuardando] = useState(false);
 const [errorFormulario,setErrorFormulario] = useState("");
 const [aviso,setAviso] = useState("");
 async function cargar() {

  try { const [{jugueteController},{categoriaController}] = await Promise.all([import("@/controllers/JugueteController"),import("@/controllers/CategoriaController")]); const [lista,grupos] = await Promise.all([jugueteController.obtenerTodos(),categoriaController.obtenerTodas()]); setProductos(lista); setCategorias(grupos); }
  catch { setError("No se pudieron cargar los productos. Revisa tu conexión y la configuración de Supabase."); }
  finally { setCargando(false); }
 }
 useEffect(() => {
  let activo = true;
  async function iniciar() {
   try {
    const [{jugueteController},{categoriaController}] = await Promise.all([import("@/controllers/JugueteController"),import("@/controllers/CategoriaController")]);
    const [lista,grupos] = await Promise.all([jugueteController.obtenerTodos(),categoriaController.obtenerTodas()]);
    if(activo) { setProductos(lista); setCategorias(grupos); }
   } catch { if(activo) setError("No se pudieron cargar los productos. Revisa tu conexión y la configuración de Supabase."); }
   finally { if(activo) setCargando(false); }
  }
  void iniciar();
  return () => { activo = false; };
 }, []);
 const categoriaNombre = (id: string) => categorias.find(c => c.id === id)?.nombre ?? "Sin categoría";
 const filtrados = productos.filter(p => (!categoria || p.categoria_id === categoria) && (!stock || estado(p) === stock) && normalizar(p.nombre + " " + p.sku).includes(normalizar(busqueda.trim())));
 const hayFiltros = Boolean(busqueda || categoria || stock);
 const limpiar = () => {setBusqueda("");setCategoria("");setStock("");};
 const abrir = () => {setErrorFormulario("");setNuevo(true);};
 async function guardar(e: FormEvent<HTMLFormElement>) {
  e.preventDefault(); const f = new FormData(e.currentTarget); setGuardando(true); setErrorFormulario("");
  try { const {jugueteController} = await import("@/controllers/JugueteController"); const p = await jugueteController.crear({nombre:String(f.get("nombre")).trim(),sku:String(f.get("sku")).trim(),categoria_id:String(f.get("categoria_id")),activo:true,precio_compra:Number(f.get("precio_compra")),precio_venta:Number(f.get("precio_venta")),stock_actual:Number(f.get("stock_actual")),stock_minimo:Number(f.get("stock_minimo")),descripcion:String(f.get("descripcion") ?? "").trim() || null}); setProductos(actual => [...actual,p].sort((a,b) => a.nombre.localeCompare(b.nombre))); limpiar();setNuevo(false);setAviso("Producto agregado correctamente: " + p.nombre); }
  catch(fallo) {setErrorFormulario(fallo && typeof fallo === "object" && "message" in fallo ? String(fallo.message) : "No se pudo guardar el producto. Intenta nuevamente.");}
  finally {setGuardando(false);}
 }
 function pedirEliminar(producto: Juguete) {
  setErrorEliminar("");
  setAviso("");
  setPorEliminar(producto);
 }
 function cancelarEliminar() {
  if (!eliminacionEnCurso.current) setPorEliminar(null);
 }
 async function eliminarProducto() {
  if (!porEliminar || eliminacionEnCurso.current) return;
  const producto = porEliminar;
  eliminacionEnCurso.current = true;
  setEliminando(true);
  setErrorEliminar("");
  try {
   const { jugueteController } = await import("@/controllers/JugueteController");
   await jugueteController.actualizar(producto.id, { activo: false });
   setProductos(actual => actual.filter(p => p.id !== producto.id));
   setDetalle(actual => actual?.id === producto.id ? null : actual);
   setPorEliminar(null);
   setAviso("Producto desactivado correctamente: " + producto.nombre);
  } catch (fallo) {
   const codigo = fallo && typeof fallo === "object" && "code" in fallo ? String(fallo.code) : "";
   setErrorEliminar(codigo === "PGRST116" || codigo === "42501"
    ? "No se pudo desactivar el producto. Revisa que tu usuario tenga permiso de actualización en Supabase y que el producto siga existiendo."
    : fallo && typeof fallo === "object" && "message" in fallo
    ? "No se pudo desactivar el producto: " + String(fallo.message)
    : "No se pudo desactivar el producto. Intenta nuevamente.");
  } finally {
   eliminacionEnCurso.current = false;
   setEliminando(false);
  }
 }
 return <main className={s.page}>
  <section className={s.panel} aria-label="Filtros de productos"><div className={s.heading}><div><div className={s.title}><h1>Productos</h1><span className={s.new}>NEW</span></div><p className={s.count} aria-live="polite">{cargando ? "Cargando productos…" : error ? "Listado no disponible" : hayFiltros ? filtrados.length + " de " + productos.length + " productos" : productos.length + " productos registrados"}</p></div><button className={s.primary} onClick={abrir} disabled={cargando || Boolean(error)}>＋ Nuevo producto</button></div>
  {!error && (cargando || productos.length > 0) && <div className={s.filters}><label>Buscar producto<div className={s.search}><Icono tipo="buscar"/><input type="search" placeholder="Nombre o SKU" value={busqueda} onChange={e => setBusqueda(e.target.value)}/></div></label><label>Categoría<select value={categoria} onChange={e => setCategoria(e.target.value)}><option value="">Todas las categorías</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label><label>Estado de stock<select value={stock} onChange={e => setStock(e.target.value)}><option value="">Todos</option><option value="disponible">En stock</option><option value="bajo">Stock bajo</option><option value="agotado">Agotado</option></select></label></div>}</section>
  {aviso && <p role="status" className={s.notice}>{aviso}</p>}
  <section className={s.results} aria-label="Listado de productos" aria-busy={cargando}>{cargando ? <div className={s.empty} role="status"><span className={s.spinner}/><p>Cargando tu inventario…</p></div> : error ? <div className={s.empty}><h2>No pudimos cargar el inventario</h2><p role="alert">{error}</p><button className={s.secondary} onClick={() => { setCargando(true); setError(""); void cargar(); }}>Reintentar</button></div> : productos.length === 0 ? <div className={s.empty}><div className={s.illustration}><Icono/></div><h2>Aún no hay productos registrados</h2><p>Cuando agregues tu primer producto aparecerá aquí junto con<br/> su SKU, categoría, stock y precios.</p><button className={s.primary} onClick={abrir}>＋ Agregar primer producto</button></div> : filtrados.length === 0 ? <div className={s.empty}><div className={s.illustration}><Icono tipo="vacio"/></div><h2>{busqueda.trim() ? "Sin resultados para “" + busqueda.trim() + "”" : "Sin resultados con estos filtros"}</h2><p>No encontramos productos con esa búsqueda. Revisa la ortografía,<br/> prueba con otro nombre o SKU, o quita los filtros aplicados.</p><button className={s.secondary} onClick={limpiar}>× Limpiar filtros</button></div> : <div className={s.tableScroll}><table className={s.table}><thead><tr>{["Producto","Categoría","Stock","Estado","P. compra","P. venta","Acciones"].map(t => <th key={t} scope="col">{t}</th>)}</tr></thead><tbody>{filtrados.map(p => <tr key={p.id}><td><div className={s.product}><span className={s.productIcon}><Icono/></span><div><strong>{p.nombre}</strong><small>SKU {p.sku}</small></div></div></td><td><span className={s.category}>{categoriaNombre(p.categoria_id)}</span></td><td><strong>{p.stock_actual} uds</strong><small className={s.minimum}>Mín. {p.stock_minimo}</small></td><td><Estado producto={p}/></td><td>{dinero.format(p.precio_compra)}</td><td><strong>{dinero.format(p.precio_venta)}</strong></td><td><div className={s.actions}><button className={s.secondary} onClick={() => setDetalle(p)} aria-label={"Ver detalles de " + p.nombre}><Icono tipo="ojo"/> Ver detalles</button><button type="button" className={s.danger} onClick={() => pedirEliminar(p)} aria-label={"Eliminar " + p.nombre}>Eliminar</button></div></td></tr>)}</tbody></table></div>}</section>
  {detalle && <Modal titulo="Detalle del producto" cerrar={() => setDetalle(null)}><div className={s.summary}><span className={s.productIcon}><Icono/></span><div><h3>{detalle.nombre}</h3><span className={s.category}>{categoriaNombre(detalle.categoria_id)}</span> <Estado producto={detalle}/></div></div><dl className={s.fields}>{[["SKU",detalle.sku],["Categoría",categoriaNombre(detalle.categoria_id)],["Stock actual",detalle.stock_actual + " uds"],["Stock mínimo",detalle.stock_minimo + " uds"],["Precio de compra",dinero.format(detalle.precio_compra)],["Precio de venta",dinero.format(detalle.precio_venta)]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>{detalle.descripcion && <p className={s.description}>{detalle.descripcion}</p>}<div className={s.footer}><button className={s.secondary} onClick={() => setDetalle(null)}>Cerrar</button></div></Modal>}
  {porEliminar && <Modal titulo="Eliminar producto" cerrar={cancelarEliminar}><div aria-busy={eliminando}><p className={s.description}>¿Quieres eliminar <strong>{porEliminar.nombre}</strong> (SKU {porEliminar.sku})? El producto se desactivará y dejará de aparecer en el listado. Sus movimientos de inventario se conservarán.</p>{errorEliminar && <p role="alert" className={s.error}>{errorEliminar}</p>}<div className={s.footer}><button type="button" autoFocus className={s.secondary} disabled={eliminando} onClick={cancelarEliminar}>Cancelar</button><button type="button" className={s.danger} disabled={eliminando} onClick={() => void eliminarProducto()}>{eliminando ? "Desactivando…" : "Sí, desactivar producto"}</button></div></div></Modal>}
  {nuevo && <Modal titulo="Nuevo producto" cerrar={() => {if(!guardando) setNuevo(false);}}><form onSubmit={guardar}><fieldset disabled={guardando} className={s.form}><label>Nombre<input name="nombre" required maxLength={200} placeholder="Nombre del producto"/></label><label>SKU<input name="sku" required maxLength={100} placeholder="JUG-0001"/></label><label className={s.full}>Categoría<select name="categoria_id" required defaultValue=""><option value="" disabled>Selecciona una categoría</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>{categorias.length === 0 && <p className={s.full}>Necesitas registrar una categoría antes de agregar productos.</p>}<label>Stock actual<input name="stock_actual" type="number" min="0" step="1" required defaultValue={0}/></label><label>Stock mínimo<input name="stock_minimo" type="number" min="0" step="1" required defaultValue={0}/></label><label>Precio de compra<input name="precio_compra" type="number" min="0" step="0.01" required placeholder="0.00"/></label><label>Precio de venta<input name="precio_venta" type="number" min="0" step="0.01" required placeholder="0.00"/></label><label className={s.full}>Descripción (opcional)<textarea name="descripcion" rows={3}/></label></fieldset>{errorFormulario && <p role="alert" className={s.error}>{errorFormulario}</p>}<div className={s.footer}><button type="button" disabled={guardando} className={s.secondary} onClick={() => setNuevo(false)}>Cancelar</button><button className={s.primary} disabled={guardando || categorias.length === 0}>{guardando ? "Guardando…" : "Guardar producto"}</button></div></form></Modal>}
 </main>;
}