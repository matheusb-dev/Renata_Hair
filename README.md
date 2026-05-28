Tela de Login
🎯 Descrição Geral

Tela inicial do sistema, responsável pela autenticação do usuário.

🖥️ Front-end
Tela de login centralizada e responsiva
Campos: Usuário e Senha
Ícones dentro dos inputs
Botão: "Entrar" com estado de carregamento
Exibir mensagens de erro:

“Preencha todos os campos”
“Usuário ou senha inválidos”
Animação de tremor em caso de erro
Cores: Fundo em gradiente rosa, componentes claros com transparência
Layout limpo e moderno

⚙️ Back-end
Validar usuário e senha
Retornar:
Sucesso → autenticação realizada
Erro → mensagem de falha
Apenas 1 tipo de acesso

🗄️ Banco de Dados
Tabela: usuarios
Campos: id, usuario, senha

Campos:

id
usuario
senha
3. Cadastro de Cliente
🎯 Descrição

Tela para cadastro de clientes do salão.

🖥️ Front-end

Campos:

Nome
CPF
Plano (Select):
Nenhum
Premium
Tipo de mensalidade (aparece apenas se Premium):
Mensal
Anual
Endereço
Telefone
E-mail

Regras:

Campo de mensalidade só aparece se Premium for selecionado
Botão: Salvar
⚙️ Back-end
Validar campos obrigatórios
Se plano = Premium:
mensalidade obrigatória
Salvar cliente
🗄️ Banco de Dados

Tabela: clientes

Campos:

id
nome
cpf
plano
tipo_mensalidade
endereco
telefone
email
4. Cadastro de Funcionário
🎯 Descrição

Cadastro dos funcionários do salão.

🖥️ Front-end

Campos:

Nome
CPF
Endereço
Telefone
E-mail
Turno:
Manhã
Tarde
Noite
Horas mensais
PJ (checkbox ou select)

Extra:

Checkbox:
“Cadastrar também como cliente”

Botão:

Salvar
⚙️ Back-end
Salvar funcionário normalmente
Se opção “cadastrar como cliente” estiver ativa:
Criar registro automático na tabela de clientes
🗄️ Banco de Dados

Tabela: funcionarios

Campos:

id
nome
cpf
endereco
telefone
email
turno
horas_mensais
pj (boolean)
5. Cadastro de Serviço
🎯 Descrição

Cadastro dos serviços oferecidos pelo salão.

🖥️ Front-end

Campos:

Nome do serviço
Tempo (em minutos)
Preço

Botão:

Salvar
⚙️ Back-end
Validar dados
Salvar serviço
🗄️ Banco de Dados

Tabela: servicos

Campos:

id
nome
tempo
preco
6. Escopo Atual

🚧 Por enquanto:

Sistema focado apenas em:
Login
Cadastro de Cliente
Cadastro de Funcionário
Cadastro de Serviço

⏳ Futuro:

Agendamento (não implementado ainda)
7. Regras Gerais do Sistema
CPF deve ser único
E-mail deve ser válido
Campos obrigatórios não podem ser vazios
Sistema deve ser simples e intuitivo
Interface deve seguir padrão visual (rosa + branco)
