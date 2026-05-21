import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

export const monitorarChuvaCritica = onDocumentCreated("leituras_sensores/{leituraId}", async (event) => {
    const snap = event.data;
    if (!snap) return;

    const dados = snap.data();
    const valorChuva = Number(dados.chuva);
    const local = dados.localizacao || "Área de Risco";

    if (valorChuva >= 80) {
        const usuariosSnapshot = await admin.firestore()
            .collection("usuarios")
            .where("notificacoesAtivas", "==", true)
            .get();

        const tokens: string[] = [];
        usuariosSnapshot.forEach((doc) => {
            const token = doc.data().fcmToken;
            if (token) tokens.push(token);
        });

        if (tokens.length > 0) {
            const message: admin.messaging.MulticastMessage = {
                notification: {
                    title: "🚨 DEFESA CIVIL: ALERTA CRÍTICO",
                    body: `Risco de deslizamento em ${local} (${valorChuva}mm). Evacue a área imediatamente!`,
                },
                // Configurações para Android
                android: {
                    priority: "high",
                    notification: {
                        channelId: "alertas_criticos", // Importante para definir sons no Android
                        priority: "max",
                        defaultSound: true,
                        defaultVibrateTimings: true,
                    },
                },
                // Configurações para iOS (Apple)
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: "🚨 DEFESA CIVIL: ALERTA CRÍTICO",
                                body: `Risco de deslizamento em ${local} (${valorChuva}mm).`,
                            },
                            sound: "default",
                            critical: true, // Se o app tiver permissão, fura o modo "Não Perturbe"
                        },
                    },
                },
                tokens: tokens,
            };

            try {
                const response = await admin.messaging().sendEachForMulticast(message);
                console.log(`Sucesso: ${response.successCount} alertas enviados.`);
                
                // Limpeza opcional: remover tokens que deram erro (ex: app desinstalado)
                if (response.failureCount > 0) {
                    console.log(`${response.failureCount} tokens falharam.`);
                }
            } catch (error) {
                console.error("Erro ao enviar mensagens:", error);
            }
        }
    }
});