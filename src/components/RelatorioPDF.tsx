import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff', // PDFs profissionais costumam ter fundo branco para impressão
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 10,
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  reportBadge: {
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 4,
    fontSize: 10,
    color: '#64748b',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  gridItem: {
    width: '50%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 11,
    color: '#1e293b',
  },
  riskBadge: {
    padding: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 80,
  },
  descriptionSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.6,
  },
  signatureSection: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureLine: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  signatureRole: {
    fontSize: 8,
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  }
});

export const RelatorioPDF = ({ data }: any) => {
  // Define a cor do risco para o PDF
  const getRiskColor = (risco: string) => {
    switch (risco) {
      case 'Crítico': return { bg: '#fee2e2', text: '#ef4444' };
      case 'Alto': return { bg: '#ffedd5', text: '#f97316' };
      default: return { bg: '#dcfce7', text: '#22c55e' };
    }
  };

  const riskStyle = getRiskColor(data.risco);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logoIcon} />
            <Text style={styles.companyName}>GEO-SAFE MONITOR</Text>
          </View>
          <Text style={styles.reportBadge}>OCORRÊNCIA {data.idGerado}</Text>
        </View>

        <Text style={styles.title}>Laudo de Inspeção Geotécnica</Text>

        {/* Informações em Grid */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Local / Área</Text>
            <Text style={styles.value}>{data.area}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Data do Registro</Text>
            <Text style={styles.value}>{data.dataFormatted}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Nível de Severidade</Text>
            <View style={[styles.riskBadge, { backgroundColor: riskStyle.bg }]}>
              <Text style={{ color: riskStyle.text }}>{data.risco}</Text>
            </View>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Status da Operação</Text>
            <Text style={styles.value}>{data.status}</Text>
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.descriptionSection}>
          <Text style={styles.label}>Parecer Técnico e Observações</Text>
          <Text style={styles.descriptionText}>
            {data.descricao || "O técnico responsável não inseriu observações detalhadas para este registro. Recomenda-se vistoria in loco para avaliação complementar da estabilidade do solo."}
          </Text>
        </View>

        {/* Assinatura */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{data.responsavel || "Engenheiro Responsável"}</Text>
          <Text style={styles.signatureRole}>CREA-SP / Técnico de Campo</Text>
        </View>

        {/* Rodapé */}
        <Text style={styles.footer}>
          Documento gerado eletronicamente via Sistema Geo-Safe. Autenticidade garantida pelo ID {data.id}.
        </Text>
      </Page>
    </Document>
  );
};