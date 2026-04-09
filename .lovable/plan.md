## Plano de Implementação (Foco nos pontos solicitados)

### 1. Simplificar senha de usuário
- Remover validação de complexidade de senha no formulário de cadastro/login

### 2. Migração de banco - Tabelas de configuração dinâmica e ingressos
- **form_config**: tabela para armazenar labels e itens dos formulários (Competição, Mostra, Workshop) editáveis pelo admin
- **tipos_ingresso**: tabela para tipos de ingresso com nome, descrição, preço, quantidade disponível, ativo
- **ingressos_vendidos**: tabela para registrar vendas de ingressos
- **event_config**: tabela para configurações gerais do evento (datas, local, etc.)

### 3. Páginas Admin
- Página de configuração dinâmica de formulários (labels, campos, modalidades por período)
- Página de criação/edição de tipos de ingresso
- Dashboard com ingressos vendidos

### 4. Landing Page
- Seção de ingressos com página de compra
- Seção Stand/Feirinha (Foto/Filmagem, Maquiagem, Plataforma 360°)

### 5. Formulários de inscrição
- Seleção de tipo (Competição, Mostra, Workshop) antes do formulário
- Campo "Como soube do festival?" após pagamento
- Participantes com nome para dupla/grupo visíveis no admin e CSV
