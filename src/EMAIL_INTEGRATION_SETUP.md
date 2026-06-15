# Configuração de Integração de Email - Instruções Técnicas

## 🎯 Objetivo

Implementar envio real de código de recuperação de senha via email usando SendGrid (recomendado) ou outro serviço.

---

## 📋 Opções de Implementação

### Opção 1: SendGrid (Recomendado - Mais Fácil)

#### Vantagens
- ✅ Plano gratuito: 100 emails/dia
- ✅ API simples e documentada
- ✅ Suporte a templates
- ✅ Relatórios de entrega
- ✅ Integração rápida

#### Desvantagens
- ❌ Requer backend externo (não suportado no Wix Vibe)
- ❌ Limite de emails no plano gratuito

---

### Opção 2: Mailgun

#### Vantagens
- ✅ Plano gratuito: 5.000 emails/mês
- ✅ Sandbox domain para testes
- ✅ Webhooks para rastreamento
- ✅ Suporte a templates

#### Desvantagens
- ❌ Requer backend externo
- ❌ Configuração mais complexa

---

### Opção 3: AWS SES

#### Vantagens
- ✅ Muito barato ($0.10 por 1.000 emails)
- ✅ Integração com AWS
- ✅ Escalável

#### Desvantagens
- ❌ Requer backend externo
- ❌ Configuração complexa
- ❌ Requer conta AWS

---

## 🚀 Implementação com SendGrid

### Passo 1: Criar Conta SendGrid

```
1. Acesse: https://sendgrid.com
2. Clique em "Sign Up"
3. Preencha o formulário
4. Confirme seu email
5. Faça login
```

### Passo 2: Gerar API Key

```
1. No dashboard, vá para Settings → API Keys
2. Clique em "Create API Key"
3. Nome: "PostOpConectado"
4. Permissões: Mail Send
5. Copie a chave (salve em local seguro)
```

### Passo 3: Verificar Sender Email

```
1. Vá para Settings → Sender Authentication
2. Clique em "Verify a Single Sender"
3. Use: noreply@posopconectado.com (ou seu domínio)
4. Confirme o email
```

### Passo 4: Criar Backend Function

**Opção A: Usando Vercel (Recomendado)**

```bash
# 1. Criar projeto Vercel
npm create vite@latest posop-backend -- --template vanilla
cd posop-backend

# 2. Instalar dependências
npm install @sendgrid/mail express cors dotenv

# 3. Criar arquivo .env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
ALLOWED_ORIGINS=https://seu-site.com

# 4. Criar api/send-recovery-code.js
```

**api/send-recovery-code.js:**
```javascript
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);

export default async function handler(req, res) {
  // Validar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validar origem
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  try {
    const { email, code, patientName } = req.body;

    // Validar dados
    if (!email || !code || !patientName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Validar código
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid code format' });
    }

    // Preparar email
    const msg = {
      to: email,
      from: 'noreply@posopconectado.com',
      subject: 'Código de Recuperação de Senha - Pós-Op Conectado',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #00BFFF; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              .code-box { 
                background-color: #fff; 
                border: 2px solid #00BFFF; 
                padding: 20px; 
                text-align: center; 
                border-radius: 8px; 
                margin: 20px 0;
              }
              .code { 
                font-size: 32px; 
                font-weight: bold; 
                color: #00BFFF; 
                letter-spacing: 5px;
              }
              .footer { 
                font-size: 12px; 
                color: #999; 
                margin-top: 20px; 
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Pós-Op Conectado</h1>
                <p>Recuperação de Senha</p>
              </div>
              <div class="content">
                <p>Olá <strong>${patientName}</strong>,</p>
                <p>Você solicitou a recuperação de senha para sua conta.</p>
                <p>Use o código abaixo para continuar:</p>
                
                <div class="code-box">
                  <div class="code">${code}</div>
                </div>
                
                <p><strong>Informações importantes:</strong></p>
                <ul>
                  <li>Este código expira em <strong>10 minutos</strong></li>
                  <li>Você tem <strong>5 tentativas</strong> para usar o código</li>
                  <li>Nunca compartilhe este código com ninguém</li>
                  <li>Se você não solicitou esta recuperação, ignore este email</li>
                </ul>
                
                <p>Se tiver dúvidas, entre em contato com nosso suporte.</p>
                
                <div class="footer">
                  <p>© 2026 Pós-Op Conectado. Todos os direitos reservados.</p>
                  <p>Este é um email automático. Por favor, não responda.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Olá ${patientName},
        
        Você solicitou a recuperação de senha para sua conta.
        
        Seu código de recuperação é: ${code}
        
        Este código expira em 10 minutos.
        Você tem 5 tentativas para usar o código.
        
        Se você não solicitou esta recuperação, ignore este email.
        
        © 2026 Pós-Op Conectado
      `
    };

    // Enviar email
    const result = await sgMail.send(msg);
    
    console.log(`Email enviado para ${email}:`, result[0].statusCode);

    return res.status(200).json({ 
      success: true,
      message: 'Email enviado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    return res.status(500).json({ 
      error: 'Erro ao enviar email',
      message: error.message
    });
  }
}
```

### Passo 5: Deploy no Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Fazer login
vercel login

# 3. Deploy
vercel

# 4. Configurar variáveis de ambiente
vercel env add SENDGRID_API_KEY
vercel env add ALLOWED_ORIGINS

# 5. Redeploy
vercel --prod
```

### Passo 6: Atualizar Hook de Recuperação de Senha

**Arquivo: `/src/hooks/usePasswordRecovery.ts`**

```typescript
// ... keep existing code (imports and constants) ...

const requestRecovery = async (emailAddress: string): Promise<boolean> => {
  setError('');
  setIsLoading(true);

  try {
    if (isEmailBlocked(emailAddress)) {
      const errorMsg = 'Muitas tentativas. Tente novamente em 15 minutos.';
      setError(errorMsg);
      logger.warn('PasswordRecovery', 'requestRecovery', 'Email blocked', { email: emailAddress });
      return false;
    }

    logger.info('PasswordRecovery', 'requestRecovery', 'Starting password recovery', { email: emailAddress });

    const { items } = await BaseCrudService.getAll<Pacientes>('pacientes');
    const patient = items.find(p => p.email === emailAddress);

    if (!patient) {
      const errorMsg = 'Não encontramos uma conta vinculada a este e-mail.';
      setError(errorMsg);
      logger.warn('PasswordRecovery', 'requestRecovery', 'Patient not found', { email: emailAddress });
      return false;
    }

    const recoveryCode = generateCode();
    const expiresAt = Date.now() + CODE_EXPIRY;

    logger.info('PasswordRecovery', 'requestRecovery', 'Recovery code generated', {
      email: emailAddress,
      code: recoveryCode,
      expiresAt: new Date(expiresAt).toISOString(),
      patientName: patient.fullName,
    });

    RECOVERY_TOKENS.set(emailAddress, {
      code: recoveryCode,
      expiresAt,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
    });

    setPatientName(patient.fullName || '');
    setEmail(emailAddress);
    setResendCooldown(emailAddress);

    // ✅ NOVO: Enviar email via backend
    try {
      const emailResponse = await fetch(
        'https://seu-backend.vercel.app/api/send-recovery-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailAddress,
            code: recoveryCode,
            patientName: patient.fullName,
          }),
        }
      );

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.message || 'Erro ao enviar email');
      }

      logger.info('PasswordRecovery', 'requestRecovery', 'Email enviado com sucesso', {
        email: emailAddress,
        timestamp: new Date().toISOString(),
      });

    } catch (emailError) {
      logger.error('PasswordRecovery', 'requestRecovery', 'Erro ao enviar email', emailError);
      // Não bloqueia o fluxo se o email falhar
      // Usuário pode usar o código do console para testes
      console.warn('Email não pôde ser enviado. Use o console para ver o código.');
    }

    // Log para debug
    console.log(`[PASSWORD RECOVERY] Code: ${recoveryCode}`);

    setStep('code');
    return true;

  } catch (err) {
    logger.error('PasswordRecovery', 'requestRecovery', 'Error requesting recovery', err);
    const errorMsg = 'Erro ao solicitar recuperação. Tente novamente.';
    setError(errorMsg);
    return false;
  } finally {
    setIsLoading(false);
  }
};

// ... keep existing code (rest of the hook) ...
```

---

## 🧪 Testar Integração

### Teste 1: Verificar Endpoint

```bash
curl -X POST https://seu-backend.vercel.app/api/send-recovery-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@gmail.com",
    "code": "123456",
    "patientName": "João Silva"
  }'
```

### Teste 2: Fluxo Completo

```
1. Acesse /patient-password-recovery
2. Digite um email
3. Clique em "Enviar Código"
4. Verifique seu email
5. Copie o código
6. Cole no campo de verificação
7. Altere a senha
```

---

## 🔒 Segurança

### Proteção CORS
```javascript
const allowedOrigins = ['https://seu-site.com', 'https://www.seu-site.com'];
if (!allowedOrigins.includes(origin)) {
  return res.status(403).json({ error: 'Not allowed' });
}
```

### Rate Limiting
```javascript
// Implementar rate limiting no Vercel
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),
});

const { success } = await ratelimit.limit(email);
if (!success) {
  return res.status(429).json({ error: 'Too many requests' });
}
```

### Validação de Email
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Invalid email' });
}
```

---

## 📊 Monitoramento

### Logs no Vercel
```bash
vercel logs
```

### Métricas SendGrid
```
1. Dashboard SendGrid
2. Statistics → Delivery
3. Visualizar taxa de entrega
```

---

## 🆘 Troubleshooting

### Email não é entregue
**Solução:**
1. Verificar API Key no SendGrid
2. Verificar sender email verificado
3. Verificar logs no Vercel
4. Testar com email pessoal

### Erro 403 (CORS)
**Solução:**
1. Adicionar origem ao ALLOWED_ORIGINS
2. Verificar URL do backend
3. Redeploy

### Erro 500
**Solução:**
1. Verificar logs: `vercel logs`
2. Verificar variáveis de ambiente
3. Testar API Key

---

## 📚 Referências

- SendGrid Docs: https://docs.sendgrid.com
- Vercel Docs: https://vercel.com/docs
- Node.js Email: https://nodemailer.com

---

## ✅ Checklist de Implementação

- [ ] Criar conta SendGrid
- [ ] Gerar API Key
- [ ] Verificar sender email
- [ ] Criar projeto Vercel
- [ ] Implementar backend function
- [ ] Configurar variáveis de ambiente
- [ ] Deploy no Vercel
- [ ] Atualizar hook de recuperação
- [ ] Testar fluxo completo
- [ ] Monitorar logs
- [ ] Documentar para equipe

---

**Status:** Pronto para implementação
**Tempo Estimado:** 30-45 minutos
**Custo:** Gratuito (plano SendGrid)
