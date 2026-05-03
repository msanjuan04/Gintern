import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type {
  ClientRow,
  InvoiceLineRow,
  InvoiceRow,
  RecurrenceType,
  UserRow,
} from "@/types/database";

const COLORS = {
  brand: "#18A66B",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  bg: "#F4F6F8",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 50,
    paddingLeft: 50,
    paddingRight: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.text,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    marginBottom: 28,
    borderBottomWidth: 2,
    borderBottomStyle: "solid",
    borderBottomColor: COLORS.brand,
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.brand,
    letterSpacing: 1,
  },
  brandTag: {
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 2,
  },
  metaRight: {
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 7,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaNumber: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  metaLine: {
    fontSize: 9,
    color: COLORS.text,
    marginTop: 4,
  },
  // Parties
  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  party: {
    width: "47%",
  },
  partyHeader: {
    fontSize: 7,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  partyLine: {
    fontSize: 9,
    color: COLORS.text,
    lineHeight: 1.4,
  },
  // Concepto
  concepto: {
    marginBottom: 18,
    padding: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
  },
  conceptoLabel: {
    fontSize: 7,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  conceptoText: {
    fontSize: 10,
    color: COLORS.text,
  },
  // Tabla líneas
  table: {
    marginBottom: 18,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: COLORS.border,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.bg,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 7,
    color: COLORS.muted,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: COLORS.border,
  },
  tableCell: {
    fontSize: 9,
  },
  // Totales
  totalsWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totals: {
    width: 240,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    fontSize: 9,
  },
  totalsRowGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopStyle: "solid",
    borderTopColor: COLORS.text,
  },
  totalsLabel: {
    fontSize: 9,
    color: COLORS.muted,
  },
  totalsValue: {
    fontSize: 9,
  },
  totalsGrandLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  totalsGrandValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  // Pago
  payment: {
    backgroundColor: COLORS.bg,
    padding: 14,
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 7,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  paymentLine: {
    fontSize: 9,
    marginTop: 2,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLORS.muted,
  },
});

// Formateo de dinero / fechas para PDF (sin Intl complicaciones)
function fmtMoney(n: number) {
  return `${n
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    .replace(/\.(\d{2})$/, ",$1")} €`;
}

function fmtDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

const RECURRENCE_LABEL: Record<RecurrenceType, string> = {
  unique: "Pago único",
  monthly: "Pago mensual",
  quarterly: "Pago trimestral",
  annual: "Pago anual",
};

type Party = {
  nombre: string;
  nif: string | null;
  direccion: string | null;
  cp: string | null;
  ciudad: string | null;
  email: string | null;
};

function userToParty(u: UserRow): Party {
  return {
    nombre: `${u.nombre} ${u.apellidos ?? ""}`.trim(),
    nif: u.nif,
    direccion: u.direccion,
    cp: u.cp,
    ciudad: u.ciudad,
    email: u.email,
  };
}

function clientToParty(c: ClientRow): Party {
  return {
    nombre: c.nombre,
    nif: c.nif,
    direccion: c.direccion,
    cp: null,
    ciudad: null,
    email: c.email,
  };
}

export type InvoicePDFProps = {
  invoice: InvoiceRow;
  lines: InvoiceLineRow[];
  issuer: UserRow;
  recipient: ClientRow | UserRow;
  recipientLabel: string; // "Facturar a", "Socio receptor", etc.
};

export function InvoicePDF({
  invoice,
  lines,
  issuer,
  recipient,
  recipientLabel,
}: InvoicePDFProps) {
  const issuerParty = userToParty(issuer);
  const recipientParty =
    "prefix_factura" in recipient
      ? userToParty(recipient as UserRow)
      : clientToParty(recipient as ClientRow);

  return (
    <Document
      title={`Factura ${invoice.invoice_number}`}
      author={issuerParty.nombre}
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>GNERAI</Text>
            <Text style={styles.brandTag}>Tecnología para PYMES</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>Factura nº</Text>
            <Text style={styles.metaNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.metaLine}>
              Emisión {fmtDate(invoice.fecha_emision)}
            </Text>
            <Text style={styles.metaLine}>
              Vencimiento {fmtDate(invoice.fecha_vencimiento)}
            </Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={styles.parties}>
          <PartyBlock label="Emisor" party={issuerParty} />
          <PartyBlock label={recipientLabel} party={recipientParty} />
        </View>

        {/* CONCEPTO */}
        <View style={styles.concepto}>
          <Text style={styles.conceptoLabel}>Concepto</Text>
          <Text style={styles.conceptoText}>{invoice.concepto}</Text>
        </View>

        {/* LÍNEAS */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>
              Descripción
            </Text>
            <Text
              style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}
            >
              Cant.
            </Text>
            <Text
              style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}
            >
              Precio
            </Text>
            <Text
              style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}
            >
              Total
            </Text>
          </View>
          {lines.map((line) => (
            <View key={line.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>
                {line.descripcion}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                {line.cantidad}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                {fmtMoney(line.precio_unitario)}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                {fmtMoney(line.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTALES */}
        <View style={styles.totalsWrap}>
          <View style={styles.totals}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Base imponible</Text>
              <Text style={styles.totalsValue}>
                {fmtMoney(invoice.base_imponible)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                IVA {invoice.iva_pct}%
              </Text>
              <Text style={styles.totalsValue}>
                {fmtMoney(invoice.iva_amount)}
              </Text>
            </View>
            {invoice.irpf_amount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  IRPF -{invoice.irpf_pct}%
                </Text>
                <Text style={styles.totalsValue}>
                  -{fmtMoney(invoice.irpf_amount)}
                </Text>
              </View>
            )}
            <View style={styles.totalsRowGrand}>
              <Text style={styles.totalsGrandLabel}>TOTAL</Text>
              <Text style={styles.totalsGrandValue}>
                {fmtMoney(invoice.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* PAGO */}
        <View style={styles.payment}>
          <Text style={styles.paymentTitle}>Datos de pago</Text>
          <Text style={styles.paymentLine}>
            Forma de pago: Transferencia bancaria
          </Text>
          {issuer.iban && (
            <Text style={styles.paymentLine}>IBAN: {issuer.iban}</Text>
          )}
          {invoice.recurrence !== "unique" && (
            <Text style={[styles.paymentLine, { color: COLORS.muted }]}>
              {RECURRENCE_LABEL[invoice.recurrence]}
              {invoice.next_due_date
                ? ` · próximo vencimiento ${fmtDate(invoice.next_due_date)}`
                : ""}
            </Text>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text>{issuerParty.nombre} · NIF {issuerParty.nif}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

function PartyBlock({ label, party }: { label: string; party: Party }) {
  return (
    <View style={styles.party}>
      <Text style={styles.partyHeader}>{label}</Text>
      <Text style={styles.partyName}>{party.nombre || "—"}</Text>
      {party.nif && (
        <Text style={styles.partyLine}>NIF: {party.nif}</Text>
      )}
      {party.direccion && (
        <Text style={styles.partyLine}>{party.direccion}</Text>
      )}
      {(party.cp || party.ciudad) && (
        <Text style={styles.partyLine}>
          {[party.cp, party.ciudad].filter(Boolean).join(" ")}
        </Text>
      )}
      {party.email && <Text style={styles.partyLine}>{party.email}</Text>}
    </View>
  );
}
