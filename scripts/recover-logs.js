
import './env.js';
import supabaseService from '../src/services/supabaseService.js';

/**
 * Script de emergência para recuperar logs a partir do console do Render
 */
const rawLogs = `
[14:32:17] 🚪 Usuário entrou em um canal
📊 [ActivityLogger] channel_join - U0A9XERBUGL
[14:43:53] 💬 Vinicius Aguiar de Oliveira em #toda-a-empresa-migma-inc: "Olá"
📊 [ActivityLogger] message - U0A9XERBUGL
[18:39:29] 💬 ADM MIGMA em #1-closer-f1-initial: "oi"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:39:35] 💬 ADM MIGMA em #1-closer-f1-initial: "proxima reuniao me informe por favor"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:39:39] 💬 ADM MIGMA em #1-closer-f1-initial: "para acompanhar"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:41:57] 💬 Miriã em #1-closer-f1-initial: "<@U0A7T9TCX8B> Eu tenho um reunião agendada para amanhã as 0..."
📊 [ActivityLogger] message - U0A8WL16G9X
[18:50:30] 💬 ADM MIGMA em #1-closer-f1-initial: "vc ja fez as 5 ligaçoes hje?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:50:36] 💬 ADM MIGMA em #1-closer-f1-initial: "ou 5 mensagens no wpp?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:51:23] 💬 Miriã em #1-closer-f1-initial: "Sim, ja fiz"
📊 [ActivityLogger] message - U0A8WL16G9X
[18:54:51] 💬 ADM MIGMA em #1-closer-f1-initial: "resultado?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:54:53] 💬 ADM MIGMA em #1-closer-f1-initial: "atenderam?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:56:08] 💬 Miriã em #1-closer-f1-initial: "3 retornaram para agendar uma conversa."
📊 [ActivityLogger] message - U0A8WL16G9X
[19:02:01] 💬 ADM MIGMA em #1-closer-f1-initial: "os de ligaçoes?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:02:02] 💬 ADM MIGMA em #1-closer-f1-initial: "3 atenderam?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:06:06] 💬 Miriã em #1-closer-f1-initial: "Não. 3 que iniciei a conversa a partir de audio, retornarem ..."
📊 [ActivityLogger] message - U0A8WL16G9X
[19:36:42] 💬 ADM MIGMA em #1-closer-f1-initial: "e de ligaçao nenhum atendeu?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:36:46] 💬 ADM MIGMA em #1-closer-f1-initial: "vc ligou3 x pra cada?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:37:27] 💬 Miriã em #1-closer-f1-initial: "Fiz 5 mensagens de wpp hoje, não ligação."
📊 [ActivityLogger] message - U0A8WL16G9X
[21:49:37] 💬 ADM MIGMA em #1-closer-cos-transfer: "Jaja entraremos em círculo para te auxiliar nos leads de hj ..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[00:16:41] 💬 ADM MIGMA em #1-closer-f1-initial: "amanha vc tem varias reunioes"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:07:42] 💬 Ceme Suaiden em #1-closer-cos-transfer: "Ela já fala Inglês fluente?"
📊 [ActivityLogger] message - U0A9DQHUU04
[03:01:00] 📅 Data: 2026-01-20
[12:23:41] 💬 ADM MIGMA em #1-closer-f1-initial: "Preciso que vc esteja no círculo para acompanhar as reuniões..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[12:33:25] 💬 ADM MIGMA em #1-closer-f1-initial: "to aq"
📊 [ActivityLogger] message - U0A7T9TCX8B
[12:33:32] 💬 ADM MIGMA em #1-closer-f1-initial: "preciso ver sua reuniao"
📊 [ActivityLogger] message - U0A7T9TCX8B
[14:31:44] 💬 Larissa Costa em #1-closer-cos-transfer: "<@U0A9DQHUU04> sim, ela fala inglês fluente e é pós-graduada..."
📊 [ActivityLogger] message - U0A8MHPPRPE
[15:17:06] 🚪 Usuário entrou em um canal
📊 [ActivityLogger] channel_join - U0AAFT96KKK
[16:27:28] 💬 Alfeu Wartully em #1-closer-f1-initial: "<@U0A8WL16G9X> me passa o numero de whatsapp que voce conver..."
📊 [ActivityLogger] message - U0A9HSNRV6U
[16:28:25] 💬 Miriã em #1-closer-f1-initial: "<tel:+553198674030|+553198674030>"
📊 [ActivityLogger] message - U0A8WL16G9X
[16:29:53] 💬 Alfeu Wartully em #1-closer-f1-initial: "Obrigado"
📊 [ActivityLogger] message - U0A9HSNRV6U
[17:36:22] 💬 ADM MIGMA em #1-closer-f1-initial: "Quando fizer reunião, entra no círculo para eu te ajudar "
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:36:54] 💬 Miriã em #1-closer-f1-initial: "Sim, em todas as reuniões entrei no circulo."
📊 [ActivityLogger] message - U0A8WL16G9X
[18:22:25] 💬 ADM MIGMA em #1-closer-cos-transfer: "Isso costuma acontecer por uma combinação de “WhatsApp Deskt..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:24:19] 💬 Larissa Costa em #1-closer-cos-transfer: "tem que logar de novo"
📊 [ActivityLogger] message - U0A8MHPPRPE
[18:24:35] 💬 Larissa Costa em #1-closer-cos-transfer: "Larissa <@U0A820SDSUF>"
📊 [ActivityLogger] message - U0A8MHPPRPE
[18:33:51] 💬 Alfeu Wartully em #1-closer-cos-transfer: "manda ai novamente"
📊 [ActivityLogger] message - U0A9HSNRV6U
[18:34:39] 💬 Alfeu Wartully em #1-closer-cos-transfer: "<@U0A8MHPPRPE>"
📊 [ActivityLogger] message - U0A9HSNRV6U
[18:42:40] 💬 Larissa Costa em #1-closer-cos-transfer: "<@U0A9HSNRV6U>"
📊 [ActivityLogger] message - U0A8MHPPRPE
[18:44:51] 💬 Alfeu Wartully em #1-closer-cos-transfer: "ai voce me envia novamente"
📊 [ActivityLogger] message - U0A9HSNRV6U
[18:45:11] 💬 Alfeu Wartully em #1-closer-cos-transfer: "pronto"
📊 [ActivityLogger] message - U0A9HSNRV6U
[18:46:09] 💬 Larissa Costa em #1-closer-cos-transfer: "entrou"
📊 [ActivityLogger] message - U0A8MHPPRPE
[18:46:12] 💬 Larissa Costa em #1-closer-cos-transfer: "obrigada"
📊 [ActivityLogger] message - U0A8MHPPRPE
[18:46:20] 💬 Larissa Costa em #1-closer-cos-transfer: "bora ver se agora os áudios vão"
📊 [ActivityLogger] message - U0A8MHPPRPE
[18:47:21] 💬 Larissa Costa em #1-closer-cos-transfer: "agora sim"
📊 [ActivityLogger] message - U0A8MHPPRPE
[19:35:37] 🚪 Usuário entrou em um canal
📊 [ActivityLogger] channel_join - U0AA33UGVD4
[01:24:41] 💬 ADM MIGMA em #1-closer-cos-transfer: "Tera reunião agora?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:27:53] 💬 Larissa Costa em #1-closer-cos-transfer: "SIM"
📊 [ActivityLogger] message - U0A8MHPPRPE
[01:28:00] 💬 Larissa Costa em #1-closer-cos-transfer: "<https://meet.google.com/qas-hfwd-jvw>"
📊 [ActivityLogger] message - U0A8MHPPRPE
[01:28:45] 💬 Larissa Costa em #1-closer-cos-transfer: "ele ainda n entrou"
📊 [ActivityLogger] message - U0A8MHPPRPE
[01:31:18] 💬 Larissa Costa em #1-closer-cos-transfer: "ENTROU"
📊 [ActivityLogger] message - U0A8MHPPRPE
[01:44:10] 💬 ADM MIGMA em #1-closer-cos-transfer: "so escuto ele, vc nao"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:44:42] 💬 ADM MIGMA em #1-closer-cos-transfer: "qual pdf vc ta apresentando? pq tinha mudado"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:49:44] 💬 ADM MIGMA em #1-closer-cos-transfer: "nao se enquadra"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:49:50] 💬 ADM MIGMA em #1-closer-cos-transfer: "somente na area q vc estudar"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:50:05] 💬 ADM MIGMA em #1-closer-cos-transfer: "nao, somente no que vc for esrtudar"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:50:13] 💬 ADM MIGMA em #1-closer-cos-transfer: "vc quer trabalhar no sol ou no ar condicionado?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:50:27] 💬 ADM MIGMA em #1-closer-cos-transfer: "pensa ai trabalhar em banco ar condicionado sentadinho na ca..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:50:46] 💬 Larissa Costa em #1-closer-cos-transfer: "o novo"
📊 [ActivityLogger] message - U0A8MHPPRPE
[01:56:37] 💬 Larissa Costa em #1-closer-cos-transfer: "??"
📊 [ActivityLogger] message - U0A8MHPPRPE
[01:57:10] 💬 ADM MIGMA em #1-closer-cos-transfer: "vc ta me escutabndo?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:58:43] 💬 Larissa Costa em #1-closer-cos-transfer: "tô"
📊 [ActivityLogger] message - U0A8MHPPRPE
[01:58:45] 💬 Larissa Costa em #1-closer-cos-transfer: "e ele tbm"
📊 [ActivityLogger] message - U0A8MHPPRPE
[02:02:45] 💬 ADM MIGMA em #1-closer-cos-transfer: "affff"
📊 [ActivityLogger] message - U0A7T9TCX8B
[02:02:52] 💬 ADM MIGMA em #1-closer-cos-transfer: "serio? kkk"
📊 [ActivityLogger] message - U0A7T9TCX8B
[02:23:25] 💬 Larissa Costa em #1-closer-cos-transfer: "<@U0A7T9TCX8B>"
📊 [ActivityLogger] message - U0A8MHPPRPE
[02:23:57] 💬 Larissa Costa em #1-closer-cos-transfer: "mandei áudio p aquela lead em espanhol que disse q tem q esp..."
📊 [ActivityLogger] message - U0A8MHPPRPE
[02:24:40] 💬 Larissa Costa em #1-closer-cos-transfer: "[23:19, 21/01/2026] <tel:+14142499991|+1 (414) 249-9991>: Es..."
📊 [ActivityLogger] message - U0A8MHPPRPE
[02:24:48] 💬 Larissa Costa em #1-closer-cos-transfer: "Existe isso que ela tá falando?"
📊 [ActivityLogger] message - U0A8MHPPRPE
[02:34:46] 💬 ADM MIGMA em #1-closer-cos-transfer: "pergunta qual o status atual dele e quando vence o i-94"
📊 [ActivityLogger] message - U0A7T9TCX8B
[02:46:43] 💬 Larissa Costa em #1-closer-cos-transfer: "tá em processo de mudança de status pra estudante, esperando..."
📊 [ActivityLogger] message - U0A8MHPPRPE
[02:46:57] 💬 Larissa Costa em #1-closer-cos-transfer: "então ela ja poderia fazer o processo p faculdade"
📊 [ActivityLogger] message - U0A8MHPPRPE
[02:47:45] 💬 Larissa Costa em #1-closer-cos-transfer: "n entendi pq ela disse q tinha q esperar 5 meses"
📊 [ActivityLogger] message - U0A8MHPPRPE
[02:48:53] 💬 Larissa Costa em #1-closer-cos-transfer: "<@U0A7T9TCX8B>"
📊 [ActivityLogger] message - U0A8MHPPRPE
[03:01:00] 📅 Data: 2026-01-21
[12:05:57] 💬 ADM MIGMA em #1-closer-cos-transfer: "entendi, tem q esperar ser aprovado para ele poder transferi..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[12:06:02] 💬 ADM MIGMA em #1-closer-cos-transfer: "faz as 3 perguntas prioridade"
📊 [ActivityLogger] message - U0A7T9TCX8B
[12:06:07] 💬 ADM MIGMA em #1-closer-cos-transfer: "quanto ele ira pagar nessa instituiçao"
📊 [ActivityLogger] message - U0A7T9TCX8B
[12:06:10] 💬 ADM MIGMA em #1-closer-cos-transfer: "a frequencia"
📊 [ActivityLogger] message - U0A7T9TCX8B
[12:06:13] 💬 ADM MIGMA em #1-closer-cos-transfer: "e permissao de trabalho.."
📊 [ActivityLogger] message - U0A7T9TCX8B
[13:13:10] 💬 Larissa Costa em #1-closer-cos-transfer: "<@U0A7T9TCX8B> Jordan apareceu"
📊 [ActivityLogger] message - U0A8MHPPRPE
[17:30:51] 💬 ADM MIGMA em #1-closer-f1-initial: "miria, vc tem q mudar o nome desse arquivo que envia aos lea..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:31:21] 💬 Miriã em #1-closer-f1-initial: "boa tarde ! tudo bem com voce?"
📊 [ActivityLogger] message - U0A8WL16G9X
[17:31:30] 💬 Miriã em #1-closer-f1-initial: "ok, vou ajustar."
📊 [ActivityLogger] message - U0A8WL16G9X
[18:55:16] 💬 ADM MIGMA em #1-closer-f1-initial: "fiz esse aqui para voce, e alterei a ordem do PDF. Primeiro ..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:55:40] 💬 ADM MIGMA em #1-closer-f1-initial: "vc tava com problemas para acessar o seu dashboard e pegar o..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:58:11] 💬 Miriã em #1-closer-f1-initial: "Ok, enviarei este aos leads."
📊 [ActivityLogger] message - U0A8WL16G9X
[19:25:17] 💬 ADM MIGMA em #1-closer-cos-transfer: "god bless!"
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:25:25] 💬 ADM MIGMA em #1-closer-cos-transfer: "congrats!!"
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:30:37] 💬 ADM MIGMA em #1-closer-f1-initial: "dashboard, conseguiu logar?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:31:21] 💬 Miriã em #1-closer-f1-initial: "Sim, logada."
📊 [ActivityLogger] message - U0A8WL16G9X
[19:31:36] 💬 ADM MIGMA em #1-closer-f1-initial: "tem algum lead querendo pagar?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:32:11] 💬 Miriã em #1-closer-f1-initial: "Ainda não."
📊 [ActivityLogger] message - U0A8WL16G9X
[19:39:22] 💬 ADM MIGMA em #1-closer-f1-initial: "dos 20 em negociaçao, tem alguem proximo de querer fechar es..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:40:46] 💬 Miriã em #1-closer-f1-initial: "Ainda este mês, tenho 1 lead. No próximo mês, tenho 2."
📊 [ActivityLogger] message - U0A8WL16G9X
[20:23:29] 💬 ADM MIGMA em #1-closer-f1-initial: "esse lead é quente, conduçao da reuniao, falar de mestrado n..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:23:39] 💬 ADM MIGMA em #1-closer-f1-initial: "por isso ele tem q entrar no processo seletivo"
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:23:46] 💬 ADM MIGMA em #1-closer-f1-initial: "e essa andrews é mto mais cara q as nossas"
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:25:18] 💬 Miriã em #1-closer-f1-initial: "Sim, já pesquisei sobre a universidade x estratégias para el..."
📊 [ActivityLogger] message - U0A8WL16G9X
[20:25:58] 💬 ADM MIGMA em #1-closer-f1-initial: "mas ainda ira fazer essa reuniaow"
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:26:00] 💬 ADM MIGMA em #1-closer-f1-initial: "?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:26:24] 💬 Miriã em #1-closer-f1-initial: "Sim"
📊 [ActivityLogger] message - U0A8WL16G9X
[20:26:58] 💬 ADM MIGMA em #1-closer-f1-initial: "otimo"
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:31:41] 💬 ADM MIGMA em #dev: "- Retirar dados bancários em FROM e em PAYMENT INSTRUCTIONS"
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:32:57] 💬 ADM MIGMA em #dev: "Para pagamento no Parcelow:  - Icluir em PAYMENT INSTRUCTION..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:36:17] 💬 ADM MIGMA em #dev: "- Não está indicando a taxa. Indicar as taxas de forma segme..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:36:47] 💬 ADM MIGMA em #dev: "Para pagamento via Zelle  - Icluir em PAYMENT INSTRUCTIONS: ..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[22:33:38] 💬 Larissa Costa em #1-closer-cos-transfer: "Boa noite, teriam aquela apresentação em inglês e espanhol? ..."
📊 [ActivityLogger] message - U0A8MHPPRPE
[22:39:45] 💬 ADM MIGMA em #1-closer-cos-transfer: "solicitando"
📊 [ActivityLogger] message - U0A7T9TCX8B
[22:40:23] 💬 ADM MIGMA em #1-closer-cos-transfer: "ta conseguindo agendar mais call?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[22:49:42] 💬 Larissa Costa em #1-closer-cos-transfer: "Estou com 4 aqui que mandei link pra agendar, estou conversa..."
📊 [ActivityLogger] message - U0A8MHPPRPE
[22:50:00] 💬 ADM MIGMA em #1-closer-cos-transfer: "precisa de alguma ajuda em algum lead?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[22:51:41] 💬 Larissa Costa em #1-closer-cos-transfer: "por enquanto não. Se eu tiver alguma dúvida eu chamo aqui co..."
📊 [ActivityLogger] message - U0A8MHPPRPE
[22:59:56] 💬 Larissa Costa em #1-closer-cos-transfer: "tenho duas nesse sábado agora."
📊 [ActivityLogger] message - U0A8MHPPRPE
[23:01:45] 💬 Larissa Costa em #1-closer-cos-transfer: "tô pensando até em colocar no domingo a agenda"
📊 [ActivityLogger] message - U0A8MHPPRPE
[23:14:15] 💬 ADM MIGMA em #1-closer-cos-transfer: "kkkk"
📊 [ActivityLogger] message - U0A7T9TCX8B
[23:14:25] 💬 ADM MIGMA em #1-closer-cos-transfer: "pode colocar da forma que quiser"
📊 [ActivityLogger] message - U0A7T9TCX8B
[23:14:55] 💬 ADM MIGMA em #1-closer-cos-transfer: "vamos fazer mais vendas!! atualizar o crm e treinar os scrip..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[03:01:00] 📅 Data: 2026-01-22
[21:24:24] 💬 Larissa Costa em #1-closer-cos-transfer: "<@U0A7T9TCX8B> já estou"
📊 [ActivityLogger] message - U0A8MHPPRPE
[21:50:03] 💬 ADM MIGMA em #1-closer-cos-transfer: "Olá boa tarde "
📊 [ActivityLogger] message - U0A7T9TCX8B
[21:50:14] 💬 ADM MIGMA em #1-closer-cos-transfer: "Já te enviaram o PDF em espanhol?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[22:19:28] 💬 Larissa Costa em #1-closer-cos-transfer: "Já sim"
📊 [ActivityLogger] message - U0A8MHPPRPE
[23:39:12] 💬 Larissa Costa em #1-closer-cos-transfer: "amanhã tenho 4 reuniões :hand_with_index_finger_and_thumb_cr..."
📊 [ActivityLogger] message - U0A8MHPPRPE
[23:50:34] 💬 ADM MIGMA em #1-closer-cos-transfer: "vou tentar te acompanhar"
📊 [ActivityLogger] message - U0A7T9TCX8B
[23:50:46] 💬 ADM MIGMA em #1-closer-cos-transfer: "quando for acontecer, avisa 10 min"
📊 [ActivityLogger] message - U0A7T9TCX8B
[23:50:56] 💬 ADM MIGMA em #1-closer-cos-transfer: "tem q atualizar no crm essas reunioes"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:04:31] 💬 Larissa Costa em #1-closer-cos-transfer: "todos com status no crm atualizado para agendado"
📊 [ActivityLogger] message - U0A8MHPPRPE
[01:07:31] 💬 ADM MIGMA em #1-closer-cos-transfer: "n estava automatico?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[01:09:24] 💬 Larissa Costa em #1-closer-cos-transfer: "não, mudei manualmente"
📊 [ActivityLogger] message - U0A8MHPPRPE
[03:01:00] 📅 Data: 2026-01-23
[16:41:35] 💬 ADM MIGMA em #1-closer-cos-transfer: "bom dia, teve reuniao?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[16:42:18] 💬 ADM MIGMA em #1-closer-f1-initial: "bom dia miriâ, como foram as reunioes de hj? deram certo?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[16:57:07] 💬 Larissa Costa em #1-closer-cos-transfer: "bom dia"
📊 [ActivityLogger] message - U0A8MHPPRPE
[16:57:24] 💬 Larissa Costa em #1-closer-cos-transfer: "os dois primeiros vai ser remarcado"
📊 [ActivityLogger] message - U0A8MHPPRPE
[16:57:31] 💬 Larissa Costa em #1-closer-cos-transfer: "tem outros 2 ainda p hoje"
📊 [ActivityLogger] message - U0A8MHPPRPE
[20:46:30] 💬 ADM MIGMA em #1-closer-cos-transfer: "TEVE?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[21:13:55] 💬 Larissa Costa em #1-closer-cos-transfer: "teve"
📊 [ActivityLogger] message - U0A8MHPPRPE
[21:14:14] 💬 Larissa Costa em #1-closer-cos-transfer: "mas ele só consegue em meados de final de  março pagar os 40..."
📊 [ActivityLogger] message - U0A8MHPPRPE
[21:14:32] 💬 Larissa Costa em #1-closer-cos-transfer: "pagou a escola de ingles agora e n devolvem o dinheiro"
📊 [ActivityLogger] message - U0A8MHPPRPE
[21:14:42] 💬 Larissa Costa em #1-closer-cos-transfer: "gostou bastante, acho q vai fechar"
📊 [ActivityLogger] message - U0A8MHPPRPE
[21:15:05] 💬 Larissa Costa em #1-closer-cos-transfer: "tenho uma de noite"
📊 [ActivityLogger] message - U0A8MHPPRPE
[21:15:19] 💬 Larissa Costa em #1-closer-cos-transfer: "essa tem mais chance de fechar logo"
📊 [ActivityLogger] message - U0A8MHPPRPE
[21:27:49] 💬 Larissa Costa em #1-closer-cos-transfer: "nesse Zelle tem como parcelar?"
📊 [ActivityLogger] message - U0A8MHPPRPE
[21:48:46] 💬 ADM MIGMA em #1-closer-cos-transfer: "parcelar 400 dolares via zelle? kkk"
📊 [ActivityLogger] message - U0A7T9TCX8B
[21:49:00] 💬 ADM MIGMA em #1-closer-cos-transfer: "400 dolares pode pagar no cartao em 24 x"
📊 [ActivityLogger] message - U0A7T9TCX8B
[21:49:06] 💬 ADM MIGMA em #1-closer-cos-transfer: "o processo ja é por etapas"
📊 [ActivityLogger] message - U0A7T9TCX8B
[21:49:09] 💬 ADM MIGMA em #1-closer-cos-transfer: "lead tem q entender isso"
📊 [ActivityLogger] message - U0A7T9TCX8B
[21:51:12] 💬 ADM MIGMA em #1-closer-cos-transfer: "quando tiver na reuniao"
📊 [ActivityLogger] message - U0A7T9TCX8B
[21:51:15] 💬 ADM MIGMA em #1-closer-cos-transfer: "entra no circulo"
📊 [ActivityLogger] message - U0A7T9TCX8B
[21:56:07] 💬 Larissa Costa em #1-closer-cos-transfer: "problema q ele n tem cartão, teria q pagar a vista"
📊 [ActivityLogger] message - U0A8MHPPRPE
[22:01:28] 💬 Larissa Costa em #1-closer-cos-transfer: "<@U0A7T9TCX8B> outra agora"
📊 [ActivityLogger] message - U0A8MHPPRPE
[03:01:00] 📅 Data: 2026-01-24
[01:18:52] 💬 ADM MIGMA em #1-closer-cos-transfer: "nos temos! mestrado na area da saude, com bolsa fica em torn..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[03:01:00] 📅 Data: 2026-01-25
[12:06:15] 💬 Miriã em #1-closer-f1-initial: "Bom dia ! Os 3 leads que agendaram, não apareceram."
📊 [ActivityLogger] message - U0A8WL16G9X
[12:06:36] 💬 Miriã em #1-closer-f1-initial: "Bom dia ! Os 3 leads que agendaram, não apareceram."
📊 [ActivityLogger] message - U0A8WL16G9X
[14:40:40] 💬 Larissa Costa em #1-closer-cos-transfer: "Perfeito!"
📊 [ActivityLogger] message - U0A8MHPPRPE
[15:03:08] 💬 ADM MIGMA em #1-closer-f1-initial: "o lead <tel:+5519998119763|+5519998119763>"
📊 [ActivityLogger] message - U0A7T9TCX8B
[15:03:17] 💬 ADM MIGMA em #1-closer-f1-initial: "vc tem duvidas dos prazos da pergunta dele?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[15:04:20] 💬 Miriã em #1-closer-f1-initial: "Nenhuma duvida, por que ?"
📊 [ActivityLogger] message - U0A8WL16G9X
[15:05:28] 💬 ADM MIGMA em #1-closer-f1-initial: "provavelmente ele ja esta planejando para dar entrada"
📊 [ActivityLogger] message - U0A7T9TCX8B
[15:06:49] 💬 Miriã em #1-closer-f1-initial: "Não, ele ainda esta em fase de planejamento. Após esta pergu..."
📊 [ActivityLogger] message - U0A8WL16G9X
[15:07:36] 💬 ADM MIGMA em #1-closer-f1-initial: "o que impede dele dar entrada agora? ele falou?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[15:14:59] 💬 Miriã em #1-closer-f1-initial: "Ele não possui ainda uma reserva financeira. É um jovem de 2..."
📊 [ActivityLogger] message - U0A8WL16G9X
[16:38:58] 💬 ADM MIGMA em #1-closer-f1-initial: "Mas a reserva seria pra que exatamente?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[16:47:52] 💬 Miriã em #1-closer-f1-initial: "Para fazer o pagamento inicial ou demonstrativo financeiro"
📊 [ActivityLogger] message - U0A8WL16G9X
[16:48:11] 💬 ADM MIGMA em #1-closer-f1-initial: "Quanto ele consegue comprovar hoje?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[16:49:20] 💬 Miriã em #1-closer-f1-initial: "Nada, ele não possui valor guardado. A renda dele é 3k mês, ..."
📊 [ActivityLogger] message - U0A8WL16G9X
[17:27:39] 💬 ADM MIGMA em #1-closer-f1-initial: "codigo 977152"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:31:38] 💬 ADM MIGMA em #1-closer-f1-initial: "deu?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:36:03] 💬 Miriã em #1-closer-f1-initial: "Não deu certo ! Deu excesso de tentativas e pediu para esper..."
📊 [ActivityLogger] message - U0A8WL16G9X
[17:40:22] 💬 ADM MIGMA em #1-closer-f1-initial: "Ele bloqueou porque tentaram entrar várias vezes. Agora tem ..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:42:07] 💬 ADM MIGMA em #1-closer-f1-initial: "com isso, o calendly nao vai ter como agendar por 48 hrs"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:42:28] 💬 ADM MIGMA em #1-closer-f1-initial: "vou mexer na configuração la para tentar resolver interiname..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:50:40] 💬 ADM MIGMA em #1-closer-f1-initial: "vc n consegue entrrar nas reunioes ne?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:54:13] 💬 Miriã em #1-closer-f1-initial: "Não consigo pois o anfitrião precisa liberar a entrada, no c..."
📊 [ActivityLogger] message - U0A8WL16G9X
[17:54:45] 💬 Miriã em #1-closer-f1-initial: "No caso, vou ligar para os leads e fazer chamada de vídeo pe..."
📊 [ActivityLogger] message - U0A8WL16G9X
[17:54:53] 💬 ADM MIGMA em #1-closer-f1-initial: "email pessol nao, tem que ser email corporativo"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:55:03] 💬 ADM MIGMA em #1-closer-f1-initial: "vc vai ter agora?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:55:50] 💬 Miriã em #1-closer-f1-initial: "O lead não confirmou ainda"
📊 [ActivityLogger] message - U0A8WL16G9X
[18:06:57] 💬 ADM MIGMA em #1-closer-f1-initial: "<https://us06web.zoom.us/j/83830862320>"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:07:34] 💬 ADM MIGMA em #1-closer-f1-initial: "vai ter q usar a sala antiga do zoom, vc pode entrar como gu..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[03:01:00] 📅 Data: 2026-01-26
[12:06:15] 💬 Miriã em #1-closer-f1-initial: "Bom dia ! Os 3 leads que agendaram, não apareceram."
📊 [ActivityLogger] message - U0A8WL16G9X
[12:06:36] 💬 Miriã em #1-closer-f1-initial: "Bom dia ! Os 3 leads que agendaram, não apareceram."
📊 [ActivityLogger] message - U0A8WL16G9X
[14:40:40] 💬 Larissa Costa em #1-closer-cos-transfer: "Perfeito!"
📊 [ActivityLogger] message - U0A8MHPPRPE
[15:03:08] 💬 ADM MIGMA em #1-closer-f1-initial: "o lead <tel:+5519998119763|+5519998119763>"
📊 [ActivityLogger] message - U0A7T9TCX8B
[15:03:17] 💬 ADM MIGMA em #1-closer-f1-initial: "vc tem duvidas dos prazos da pergunta dele?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[15:04:20] 💬 Miriã em #1-closer-f1-initial: "Nenhuma duvida, por que ?"
📊 [ActivityLogger] message - U0A8WL16G9X
[15:05:28] 💬 ADM MIGMA em #1-closer-f1-initial: "provavelmente ele ja esta planejando para dar entrada"
📊 [ActivityLogger] message - U0A7T9TCX8B
[15:06:49] 💬 Miriã em #1-closer-f1-initial: "Não, ele ainda esta em fase de planejamento. Após esta pergu..."
📊 [ActivityLogger] message - U0A8WL16G9X
[15:07:36] 💬 ADM MIGMA em #1-closer-f1-initial: "o que impede dele dar entrada agora? ele falou?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[15:14:59] 💬 Miriã em #1-closer-f1-initial: "Ele não possui ainda uma reserva financeira. É um jovem de 2..."
📊 [ActivityLogger] message - U0A8WL16G9X
[16:38:58] 💬 ADM MIGMA em #1-closer-f1-initial: "Mas a reserva seria pra que exatamente?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[16:47:52] 💬 Miriã em #1-closer-f1-initial: "Para fazer o pagamento inicial ou demonstrativo financeiro"
📊 [ActivityLogger] message - U0A8WL16G9X
[16:48:11] 💬 ADM MIGMA em #1-closer-f1-initial: "Quanto ele consegue comprovar hoje?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[16:49:20] 💬 Miriã em #1-closer-f1-initial: "Nada, ele não possui valor guardado. A renda dele é 3k mês, ..."
📊 [ActivityLogger] message - U0A8WL16G9X
[17:27:39] 💬 ADM MIGMA em #1-closer-f1-initial: "codigo 977152"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:31:38] 💬 ADM MIGMA em #1-closer-f1-initial: "deu?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:36:03] 💬 Miriã em #1-closer-f1-initial: "Não deu certo ! Deu excesso de tentativas e pediu para esper..."
📊 [ActivityLogger] message - U0A8WL16G9X
[17:40:22] 💬 ADM MIGMA em #1-closer-f1-initial: "Ele bloqueou porque tentaram entrar várias vezes. Agora tem ..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:42:07] 💬 ADM MIGMA em #1-closer-f1-initial: "com isso, o calendly nao vai ter como agendar por 48 hrs"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:42:28] 💬 ADM MIGMA em #1-closer-f1-initial: "vou mexer na configuração la para tentar resolver interiname..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:50:40] 💬 ADM MIGMA em #1-closer-f1-initial: "vc n consegue entrrar nas reunioes ne?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:54:13] 💬 Miriã em #1-closer-f1-initial: "Não consigo pois o anfitrião precisa liberar a entrada, no c..."
📊 [ActivityLogger] message - U0A8WL16G9X
[17:54:45] 💬 Miriã em #1-closer-f1-initial: "No caso, vou ligar para os leads e fazer chamada de vídeo pe..."
📊 [ActivityLogger] message - U0A8WL16G9X
[17:54:53] 💬 ADM MIGMA em #1-closer-f1-initial: "email pessol nao, tem que ser email corporativo"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:55:03] 💬 ADM MIGMA em #1-closer-f1-initial: "vc vai ter agora?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[17:55:50] 💬 Miriã em #1-closer-f1-initial: "O lead não confirmou ainda"
📊 [ActivityLogger] message - U0A8WL16G9X
[18:06:57] 💬 ADM MIGMA em #1-closer-f1-initial: "<https://us06web.zoom.us/j/83830862320>"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:07:34] 💬 ADM MIGMA em #1-closer-f1-initial: "vai ter q usar a sala antiga do zoom, vc pode entrar como gu..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:56:40] 💬 ADM MIGMA em #1-closer-cos-transfer: "<tel:+16197044163|+1 (619) 704-4163> FABIO COS"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:57:02] 💬 ADM MIGMA em #1-closer-cos-transfer: "<tel:+13855909471|+1 (385) 590-9471> raony cos"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:57:37] 💬 ADM MIGMA em #1-closer-cos-transfer: "<tel:+13213673617|+1 (321) 367-3617> alessandra cos filho"
📊 [ActivityLogger] message - U0A7T9TCX8B
[18:57:43] 💬 ADM MIGMA em #1-closer-cos-transfer: "coloque no seu crm esses leads e chame eles"
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:08:26] 💬 Paulo victor em #dev: "opa"
📊 [ActivityLogger] message - U0A83923VHA
[19:08:50] 💬 Paulo victor em #dev: "<@U0A7T9TCX8B>"
📊 [ActivityLogger] message - U0A83923VHA
[19:09:20] 🚪 Usuário entrou em um canal
📊 [ActivityLogger] channel_join - U0A9HSNRV6U
[19:15:04] 🚪 Usuário entrou em um canal
📊 [ActivityLogger] channel_join - U0AA33UGVD4
[19:22:26] 💬 ADM MIGMA em #dev: "[15:48, 1/26/2026] Alfeu Wartully Diretor Mkt: após isso, ca..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[19:42:43] 💬 Larissa Costa em #1-closer-cos-transfer: "Opa, sim"
📊 [ActivityLogger] message - U0A8MHPPRPE
[20:16:36] 💬 ADM MIGMA em #1-closer-f1-initial: "n tera reuniao?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:26:31] 💬 ADM MIGMA em #dev: "operador"
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:26:35] 💬 ADM MIGMA em #dev: "70346655"
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:36:06] 💬 ADM MIGMA em #1-closer-cos-transfer: "tem 44 tarefas hj no crm nao feitas, esta com dificuldade?"
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:40:34] 💬 ADM MIGMA em #1-closer-cos-transfer: "7. Papel do Vendedor Migma 7.1 Rotina Diária 1.      inicio*..."
📊 [ActivityLogger] message - U0A7T9TCX8B
[20:49:07] 💬 Miriã em #1-closer-f1-initial: "Acessei a sala pelo calendly e fiz a reunião normalmente com..."
📊 [ActivityLogger] message - U0A8WL16G9X
`;


async function backfill() {
    console.log('🚀 Iniciando recuperação de logs com datas corrigidas...');

    const lines = rawLogs.split('\n');
    let currentDate = '2026-01-19'; // As primeiras mensagens são do dia 19
    let recoveredCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detecta mudança de data nos relatórios
        if (line.includes('📅 Data:')) {
            const reportDate = line.split('Data:')[1].trim();
            currentDate = reportDate; // A partir daqui, as mensagens pertencem a esta data
            console.log(`📅 Mudança detectada: Mensagens agora serão registradas no dia ${currentDate}`);
            continue;
        }

        // Detecta mensagem
        // Ex: [18:39:29] 💬 ADM MIGMA em #1-closer-f1-initial: "oi"
        const msgMatch = line.match(/\[(\d{2}:\d{2}:\d{2})\] 💬 (.*?) em #(.*?): "(.*)"/);
        const loggerMatch = lines[i + 1]?.match(/📊 \[ActivityLogger\] (.*?) - (.*)/);

        if (msgMatch && loggerMatch) {
            const [_, time, userName, channelName, text] = msgMatch;
            const [__, eventType, userId] = loggerMatch;

            const timestamp = `${currentDate}T${time}.000Z`; // Aproximação UTC

            await supabaseService.saveRawEvent({
                timestamp,
                userId,
                eventType,
                channelId: channelName,
                text,
                userName
            });

            recoveredCount++;
            if (recoveredCount % 10 === 0) console.log(`✅ Recuperados: ${recoveredCount}...`);
            i++; // Pula a linha do ActivityLogger já processada
        }

        // Detecta entrada em canal
        // Ex: [14:32:17] 🚪 Usuário entrou em um canal
        const joinMatch = line.match(/\[(\d{2}:\d{2}:\d{2})\] 🚪 Usuário entrou em um canal/);
        if (joinMatch && lines[i + 1]?.includes('channel_join')) {
            const time = joinMatch[1];
            const loggerJoin = lines[i + 1].match(/📊 \[ActivityLogger\] (.*?) - (.*)/);
            if (loggerJoin) {
                const [_, eventType, userId] = loggerJoin;
                await supabaseService.saveRawEvent({
                    timestamp: `${currentDate}T${time}.000Z`,
                    userId,
                    eventType,
                    channelId: 'unknown'
                });
                recoveredCount++;
                i++;
            }
        }
    }

    console.log(`\n✨ Recuperação concluída! Total de ${recoveredCount} eventos injetados.`);
    process.exit(0);
}

backfill();
