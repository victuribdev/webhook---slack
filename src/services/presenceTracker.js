import slackService from './slackService.js';
import activityLogger from './activityLogger.js';

/**
 * Serviço para rastrear a presença dos usuários via polling
 * Isso ajuda a implementar a "Opção 2": saber quem ficou online após uma mensagem
 */
class PresenceTracker {
    constructor() {
        this.intervalTime = 5 * 60 * 1000; // 5 minutos (evitar rate limit)
        this.isRunning = false;
        this.lastPresence = new Map(); // Cache local para evitar logs redundantes
    }

    /**
     * Inicia o rastreamento periódico
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        console.log(`📡 [PresenceTracker] Iniciando monitoramento de presença (intervalo: ${this.intervalTime / 1000}s)`);

        // Primeira execução imediata
        this.checkAllPresences();

        // Agendamento
        this.interval = setInterval(() => this.checkAllPresences(), this.intervalTime);
    }

    /**
     * Interrompe o rastreamento
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.isRunning = false;
        }
    }

    /**
     * Verifica a presença de todos os usuários do workspace
     */
    async checkAllPresences() {
        const time = new Date().toLocaleTimeString('pt-BR');
        // console.log(`[${time}] 🔍 Verificando presença de todos os usuários...`);

        try {
            const result = await slackService.getAllUsers();
            if (!result.success) {
                console.error('❌ [PresenceTracker] Falha ao obter lista de usuários');
                return;
            }

            const activeMembers = result.users.filter(u => !u.is_bot && !u.deleted && u.id !== 'USLACKBOT');

            // Para cada membro, verifica presença
            // Nota: users.getPresence tem limite de taxa, mas para workspaces pequenos/médios 
            // 5 minutos é seguro. Se houver muitos usuários, deveríamos usar batching.
            for (const member of activeMembers) {
                const presenceResult = await slackService.getUserPresence(member.id);

                if (presenceResult.success) {
                    const currentPresence = presenceResult.presence;
                    const previousPresence = this.lastPresence.get(member.id);

                    // Só logamos se houver mudança OU se o usuário estiver ativo 
                    // (para garantir pontos na timeline do dashboard)
                    if (currentPresence === 'active') {
                        // Loga como evento de presença
                        activityLogger.logPresenceChange(member.id, 'active');
                        // console.log(`[PresenceTracker] ${member.real_name} está Online`);
                    }

                    this.lastPresence.set(member.id, currentPresence);
                }

                // Pequeno delay para evitar burst no rate limit
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error('❌ [PresenceTracker] Erro fatal no ciclo de checagem:', error.message);
        }
    }
}

export default new PresenceTracker();
