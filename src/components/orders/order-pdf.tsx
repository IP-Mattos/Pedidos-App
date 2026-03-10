'use client'

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import { Order } from '@/types/database'
import { FileDown } from 'lucide-react'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 24,
    borderBottom: '2px solid #dc2626',
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1px solid #e5e7eb',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 120,
    color: '#6b7280',
  },
  value: {
    flex: 1,
    color: '#111827',
  },
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: '6 8',
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '5 8',
    borderBottom: '1px solid #f3f4f6',
  },
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  tableHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#6b7280',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '2px solid #e5e7eb',
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#374151',
    marginRight: 16,
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#dc2626',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 8,
  },
})

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  completado: 'Completado',
  pagado: 'Pagado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  credito: 'Crédito',
  dolares: 'Dólares',
  cheque: 'Cheque',
  transferencia: 'Transferencia',
}

function OrderDocument({ order }: { order: Order }) {
  const fecha = new Date(order.fecha_entrega).toLocaleDateString('es-UY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const creado = new Date(order.created_at).toLocaleString('es-UY')

  return (
    <Document title={`Pedido - ${order.nombre_cliente}`}>
      <Page size='A4' style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pedido</Text>
          <Text style={styles.subtitle}>
            #{order.id.slice(-12).toUpperCase()} · Creado el {creado}
          </Text>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{order.nombre_cliente}</Text>
          </View>
          {order.customer_phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{order.customer_phone}</Text>
            </View>
          )}
          {order.customer_address && (
            <View style={styles.row}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.value}>{order.customer_address}</Text>
            </View>
          )}
        </View>

        {/* Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del pedido</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Estado</Text>
            <Text style={styles.value}>{STATUS_LABELS[order.status] ?? order.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de entrega</Text>
            <Text style={styles.value}>{fecha}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Método de pago</Text>
            <Text style={styles.value}>{METODO_LABELS[order.metodo_pago] ?? order.metodo_pago}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pago</Text>
            <Text style={styles.value}>{order.esta_pagado ? 'Pagado' : 'Pendiente de pago'}</Text>
          </View>
          {order.assignee && (
            <View style={styles.row}>
              <Text style={styles.label}>Trabajador</Text>
              <Text style={styles.value}>{order.assignee.full_name}</Text>
            </View>
          )}
        </View>

        {/* Productos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colProduct]}>Producto</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Precio</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Subtotal</Text>
            </View>
            {order.lista_productos.map((p, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colProduct}>{p.producto}</Text>
                <Text style={styles.colQty}>{p.cantidad}</Text>
                <Text style={styles.colPrice}>${p.precio.toFixed(2)}</Text>
                <Text style={styles.colTotal}>${(p.precio * p.cantidad).toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.monto_total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notas */}
        {order.notas && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={{ color: '#374151', fontStyle: 'italic' }}>{order.notas}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generado el {new Date().toLocaleString('es-UY')} · Pedidos App
        </Text>
      </Page>
    </Document>
  )
}

function WorkerOrderDocument({ order }: { order: Order }) {
  const fecha = new Date(order.fecha_entrega).toLocaleDateString('es-UY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document title={`Pedido - ${order.nombre_cliente}`}>
      <Page size='A4' style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Lista de Pedido</Text>
          <Text style={styles.subtitle}>#{order.id.slice(-12).toUpperCase()}</Text>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{order.nombre_cliente}</Text>
          </View>
          {order.customer_phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{order.customer_phone}</Text>
            </View>
          )}
          {order.customer_address && (
            <View style={styles.row}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.value}>{order.customer_address}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Fecha entrega</Text>
            <Text style={styles.value}>{fecha}</Text>
          </View>
        </View>

        {/* Productos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colProduct]}>Producto</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Precio</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Subtotal</Text>
            </View>
            {order.lista_productos.map((p, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colProduct}>{p.producto}</Text>
                <Text style={styles.colQty}>{p.cantidad}</Text>
                <Text style={styles.colPrice}>${p.precio.toFixed(2)}</Text>
                <Text style={styles.colTotal}>${(p.precio * p.cantidad).toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.monto_total.toFixed(2)}</Text>
          </View>
        </View>

        {order.notas && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={{ color: '#374151', fontStyle: 'italic' }}>{order.notas}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Generado el {new Date().toLocaleString('es-UY')} · Pedidos App
        </Text>
      </Page>
    </Document>
  )
}

export function WorkerOrderPDFButton({ order }: { order: Order }) {
  const filename = `pedido-${order.nombre_cliente.replace(/\s+/g, '-').toLowerCase()}-${order.id.slice(-6)}.pdf`

  return (
    <PDFDownloadLink document={<WorkerOrderDocument order={order} />} fileName={filename}>
      {({ loading }) => (
        <button
          disabled={loading}
          className='inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-wait'
        >
          <FileDown className='h-4 w-4 mr-1.5' />
          {loading ? 'Generando...' : 'Descargar PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}

export function OrderPDFButton({ order }: { order: Order }) {
  const filename = `pedido-${order.nombre_cliente.replace(/\s+/g, '-').toLowerCase()}-${order.id.slice(-6)}.pdf`

  return (
    <PDFDownloadLink document={<OrderDocument order={order} />} fileName={filename}>
      {({ loading }) => (
        <button
          disabled={loading}
          className='inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-wait'
        >
          <FileDown className='h-4 w-4 mr-1.5' />
          {loading ? 'Generando...' : 'Descargar PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
