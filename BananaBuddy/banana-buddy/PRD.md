1. Visão Geral do Produto

Banana Buddy é um aplicativo mobile de fitness gamificado centrado em um avatar 3D interativo: uma banana. O estado visual da banana reflete diretamente os hábitos de saúde do usuário — quanto mais ativo e consistente ele for, mais viçosa, reluzente e estilosa a banana fica. Em caso de inatividade prolongada, ela amadurece progressivamente até apodrecer.
 
O diferencial do produto está na combinação de três pilares:
• Feedback visual imediato e emocional (banana saudável vs. podre)
• Competição social através das "Bananeiras" (clãs de amigos)
• Sistema de progressão com skins desbloqueáveis por tipo de atividade
 
1.1 Proposta de Valor

A maioria dos aplicativos de fitness falha em manter o engajamento de longo prazo porque o feedback de progresso é abstrato (gráficos, números). O Banana Buddy humaniza o progresso através de um personagem que o usuário cuida, criando responsabilidade emocional e pressão social positiva dentro de grupos de amigos.
 

2. Objetivos de Negócio e Métricas de Sucesso

2.1 Objetivos

• Atingir 100.000 usuários ativos mensais (MAU) em 12 meses pós-lançamento
• Alcançar retenção D30 ≥ 40% (benchmark premium para apps de fitness)
• Gerar receita recorrente via monetização de skins e passes premium
• Estabelecer parcerias com academias e estúdios de artes marciais para distribuição
 
2.2 KPIs Principais

Métrica
Meta 6 meses
Meta 12 meses
MAU (Usuários Ativos Mensais)
30.000
100.000
Retenção D7
≥ 55%
≥ 60%
Retenção D30
≥ 35%
≥ 40%
Streak médio dos usuários ativos
≥ 7 dias
≥ 14 dias
Grupos (Bananeiras) criados
5.000
20.000
Taxa de conversão para premium
≥ 8%
≥ 12%
NPS
≥ 50
≥ 65
 

3. Público-Alvo

3.1 Personas Primárias

Persona 1 — O Iniciante Motivado
João, 24 anos, começou a malhar há 3 meses mas sente dificuldade de manter a consistência. Usa TikTok e Discord com amigos. Precisa de um "motivo extra" para não faltar ao treino.
 
Persona 2 — O Atleta Social
Camila, 28 anos, pratica jiu-jitsu há 2 anos e adora a cultura do esporte. Quer uma forma divertida de acompanhar o progresso dos amigos e mostrar dedicação com estilo.
 
Persona 3 — O Competitivo Casual
Rafael, 31 anos, vai à academia regularmente mas não acompanha métricas. Sente-se motivado por rankings e não quer "perder" para amigos. A gamificação social é o principal gatilho.
 
3.2 Público Secundário

• Influenciadores fitness que podem usar a plataforma como ferramenta de engajamento com seguidores
• Academias e estúdios que podem oferecer o app aos alunos como benefício
 

4. Funcionalidades do Produto

4.1 A Banana 3D Interativa

O coração do produto. A banana é renderizada em 3D e responde a gestos do usuário:
• Rotação livre ao arrastar o dedo/mouse em qualquer direção
• Animações táteis: ao tocar, a banana reage com bounce suave
• Zoom via pinch-to-zoom para ver detalhes das skins
• Partículas e efeitos visuais que variam conforme o estado da banana
 
Tecnologia sugerida:
• Three.js (WebGL) para versão web / React Native Three Fiber para mobile
• Modelos GLB/GLTF com esqueleto de animação
• Shaders customizados para efeito de brilho e putrefação
 

4.2 Sistema de Estados da Banana

O estado da banana muda dinamicamente com base na atividade registrada. Os estados são progressivos e visuais:
 
Estado
Gatilho
Visual
Efeito Especial
🌟 Reluzente
Meta cumprida no dia
Amarelo vibrante, brilhosa
Partículas douradas ao redor
🔥 On Fire
7+ dias seguidos
Banana com chamas animadas
Trilha de fogo ao girar
💎 Lendária
30+ dias seguidos
Banana dourada/cristalina
Aura pulsante permanente
😊 Saudável
Atividade recente (1-2 dias)
Amarelo normal, firme
Reflexo de luz suave
😐 Amadurecendo
2-4 dias sem atividade
Amarelo com manchas marrons
Moscas ocasionais
😰 Quase Podre
4-6 dias sem atividade
Marrom predominante
Fumaça saindo
💀 Podre
7+ dias sem atividade
Preta/murcha, líquido vazando
Animação de decomposição
 
Nota de UX: a transição entre estados deve ser gradual e visível, incentivando o usuário a agir antes de atingir o próximo estado negativo. Notificações push agressivas nos estados de "Amadurecendo" e "Quase Podre".
 

4.3 Sistema de Streak (Dias Seguidos)

• Cada dia com meta cumprida incrementa o streak counter
• Streaks são exibidos com destaque no perfil e na banana
• Marcos de streak desbloqueiam skins e títulos especiais:
◦ 7 dias → Skin "Banana Chamas" + título "Persistente"
◦ 14 dias → Efeito "Aura Dourada"
◦ 30 dias → Skin "Banana Lendária" + título "Inabalável"
◦ 90 dias → Skin exclusiva "Banana Diamante" (ultra-rara)
• Perda de streak: o estado da banana deteriora mais rapidamente após quebrar um longo streak
• "Escudo de Streak": item especial que protege o streak por 1 dia (obtido via ranking ou compra)
 

4.4 Skins por Modalidade Esportiva

Skins são desbloqueadas ao registrar um número mínimo de sessões de uma modalidade específica. Cada skin transforma completamente a aparência da banana:
 
Skin
Modalidade
Desbloqueio
Descrição Visual
🏋️ Banana Maromba
Musculação
20 sessões
Banana com braços musculosos, faixa na cabeça, halteres
🥋 Banana Jiu-Jitsu
Jiu-Jitsu / MMA
20 sessões
Banana com kimono branco/azul, faixa colorida na cintura
🥊 Banana Boxer
Boxe / Muay Thai
20 sessões
Banana com luvas de box, protetor bucal, shorts esportivos
🏃 Banana Runner
Corrida / Cardio
30 sessões
Banana com tênis, óculos de sol, fones de ouvido
🧘 Banana Zen
Yoga / Pilates
15 sessões
Banana em posição de lótus, aura colorida
🚴 Banana Ciclista
Ciclismo
20 sessões
Banana com capacete, óculos aerodinâmico, bike
⚽ Banana Craque
Futebol / Esportes coletivos
25 sessões
Banana com chuteira, camisa de time genérica
🏊 Banana Aquática
Natação
20 sessões
Banana com touca, óculos de natação, maiô
 
Skins premium (obtidas por compra ou eventos sazonais) incluem variações: Banana Natalina, Banana Carnaval, Banana Astronauta, entre outras.
 

4.5 Bananeiras — Sistema de Grupos Sociais

As "Bananeiras" são grupos de amigos (clãs) dentro do app, inspirados em guildas de jogos. Cada bananeira tem:
 
4.5.1 Estrutura do Grupo
• Nome e avatar customizável para o grupo (ex: "Bananeiras do Crossfit SP")
• Capacidade: até 20 membros por padrão (expandível com plano premium)
• Hierarquia: Fundador, Capitão, Membro
• Feed interno com atividades recentes dos membros
 
4.5.2 Visualização Side-by-Side
A funcionalidade central das Bananeiras é a visualização onde todas as bananas dos membros aparecem lado a lado numa prateleira. O estado visual de cada banana é imediatamente visível:
• Banana podre de um amigo gera notificação e provocação automática
• Quando um membro entra em "On Fire", todos do grupo recebem notificação
• Possibilidade de "cutucar" amigos inativos (envio de notificação bem-humorada)
 
4.5.3 Sistema de Ranking das Bananeiras
Posição
Critério de Pontuação
Recompensa Mensal
🥇 1º lugar
Maior média de pontos dos membros
Skin exclusiva da bananeira + badge dourado
🥈 2º lugar
Segunda maior média
Moedas de banana + badge prata
🥉 3º lugar
Terceira maior média
Boost de XP por 7 dias
Top 10%
Percentil superior de pontuação
Item cosmético raro
Participação
Bananeira ativa no período
Moedas de banana
 
4.5.4 Sistema de Pontos
• 1 sessão registrada = 10 pontos base
• Multiplicadores: streak ativo (+50%), meta diária cumprida (+25%), novo recorde (+100%)
• Pontos decaem em caso de inatividade (exceto com escudo ativo)
• Placar semanal e mensal com reset periódico
 

4.6 Integração com Plataformas de Saúde

Plataforma
Dados Importados
Status
Google Fit
Passos, calorias, sessões de treino, frequência cardíaca
MVP — Prioridade 1
Apple Health (HealthKit)
Todos os workouts, atividade, sono
MVP — Prioridade 1
Garmin Connect
Atividades detalhadas, métricas avançadas
V2 — Pós-lançamento
Strava
Corridas, ciclismo, natação
V2 — Pós-lançamento
Samsung Health
Passos, exercícios
V2 — Pós-lançamento
Registro Manual
Qualquer atividade via formulário
MVP — Fallback universal
 
A integração deve ser automática e em background — o usuário não deve precisar abrir o app para que as metas sejam computadas. A importação de dados das plataformas de saúde valida e pontua as sessões de treino.
 

5. Fluxos Principais de Usuário

5.1 Onboarding

• Tela 1: Apresentação da banana 3D com animação de boas-vindas
• Tela 2: Seleção de modalidades de interesse (define skins-alvo sugeridas)
• Tela 3: Definição de metas iniciais (ex: 3 treinos por semana)
• Tela 4: Conexão com Google Fit / Apple Health
• Tela 5: Convite para criar ou entrar em uma Bananeira
• Tela 6: Banco de nome da banana (personalização)
 
5.2 Loop Diário Principal

• Usuário abre o app → vê banana em 3D no estado atual
• Verifica feed da Bananeira → vê estado das bananas dos amigos
• Registra treino (manual ou via integração automática)
• Banana evolui visualmente com animação celebratória
• Progresso de streak, pontos e desbloqueios são exibidos
• Opção de provocar amigos inativos ou compartilhar conquista
 
5.3 Fluxo de Desbloqueio de Skin

• Sistema detecta X sessões da modalidade → notificação push
• Usuário abre app → animação cinematográfica de desbloqueio da skin
• Opção de equipar imediatamente ou manter no inventário
• Compartilhamento automático opcional para a Bananeira
 

6. Arquitetura Técnica de Alto Nível

6.1 Frontend Mobile

• Framework: React Native com Expo
• 3D Rendering: Three.js via react-three-fiber + expo-gl
• Animações: Reanimated 3 + Skia para efeitos 2D
• State management: Zustand
 
6.2 Backend

• Runtime: Node.js com Fastify
• Banco de dados principal: PostgreSQL (usuários, grupos, histórico)
• Cache e sessões: Redis
• Real-time (feed de grupos): WebSockets via Socket.io ou Supabase Realtime
• Storage de assets (skins, modelos 3D): AWS S3 + CloudFront
• Notificações push: Firebase Cloud Messaging (FCM)
 
6.3 Integrações de Saúde

• Google Fit REST API — OAuth 2.0
• Apple HealthKit — via módulo nativo em Swift
• Jobs de sincronização em background a cada 15 minutos
• Validação anti-fraude: limites de calorias/passos por sessão
 

7. Modelo de Monetização

7.1 Plano Free

• Acesso completo ao sistema de estados da banana
• 1 Bananeira por usuário (até 10 membros)
• Skins desbloqueáveis por conquista (sem limite)
• Integração com 1 plataforma de saúde
• Acesso ao ranking global
 
7.2 Plano Premium — "Banana Gold" (R$ 14,90/mês ou R$ 119,90/ano)

• Bananeiras ilimitadas (até 50 membros cada)
• Integração com todas as plataformas de saúde simultaneamente
• 3 Escudos de Streak por mês
• Acesso antecipado a skins sazonais
• Banana personalizada: cores customizáveis e acessórios
• Estatísticas avançadas e relatórios de progresso
• Badge exclusivo "Gold" visível para amigos
 
7.3 Loja de Skins (Microtransações)

• Skins premium e sazonais: R$ 4,90 – R$ 19,90 por item
• Pacotes temáticos (ex: "Pack Artes Marciais"): R$ 29,90
• Moedas de Banana (moeda virtual): compráveis em pacotes
• Sem skins pay-to-win — todas as skins funcionais são desbloqueáveis gratuitamente
 

8. Requisitos Não-Funcionais

Requisito
Especificação
Performance 3D
60 FPS estável em dispositivos mid-range (Snapdragon 665+, A13 Bionic+)
Tempo de carregamento inicial
< 3 segundos para a tela principal
Tamanho do app
< 80MB no download inicial (assets adicionais baixados sob demanda)
Disponibilidade do backend
99,9% SLA
Sincronização offline
Treinos registrados offline devem sincronizar ao voltar online
Privacidade (LGPD / GDPR)
Dados de saúde não compartilhados com terceiros sem consentimento explícito
Acessibilidade
WCAG 2.1 nível AA para elementos não-3D
Segurança
Autenticação via OAuth + JWT; dados de saúde criptografados em trânsito e em repouso
 

