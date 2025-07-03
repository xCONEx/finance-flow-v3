import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { PaymentFormProps, PaymentData } from '../../types/stripe';
import { stripeService } from '../../services/stripeService';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'BRL',
  description,
  onSuccess,
  onError,
  loading = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe não inicializado');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Criar payment intent
      const paymentData: PaymentData = {
        amount: amount * 100, // Converter para centavos
        currency: currency.toLowerCase(),
        description: description || 'Pagamento Finance Flow',
        metadata: {
          name: formData.name,
          email: formData.email,
        },
      };

      const paymentResponse = await stripeService.createPaymentIntent(paymentData);

      if (!paymentResponse.success || !paymentResponse.clientSecret) {
        throw new Error(paymentResponse.error?.message || 'Erro ao criar payment intent');
      }

      // Confirmar pagamento
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentResponse.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: formData.name,
              email: formData.email,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Erro ao confirmar pagamento');
      }

      if (paymentIntent?.status === 'succeeded') {
        setSuccess(true);
        onSuccess(paymentIntent.id);
      } else {
        throw new Error('Pagamento não foi processado com sucesso');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Pagamento Confirmado!
            </h3>
            <p className="text-gray-600">
              Seu pagamento de {formatCurrency(amount)} foi processado com sucesso.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Pagamento Seguro
        </CardTitle>
        <CardDescription>
          Complete o pagamento de {formatCurrency(amount)} usando seu cartão de crédito
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados pessoais */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Digite seu nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="text"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="seu@email.com"
              required
            />
          </div>

          {/* Dados do cartão */}
          <div className="space-y-2">
            <Label>Dados do cartão</Label>
            <div className="border rounded-md p-3">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botão de pagamento */}
          <Button
            type="submit"
            disabled={!stripe || processing || loading}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar {formatCurrency(amount)}
              </>
            )}
          </Button>

          {/* Informações de segurança */}
          <div className="text-xs text-gray-500 text-center">
            <p>🔒 Seus dados estão protegidos com criptografia SSL</p>
            <p>💳 Aceitamos todos os principais cartões de crédito</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Componente wrapper para fornecer contexto do Stripe
export const PaymentFormWrapper: React.FC<PaymentFormProps> = (props) => {
  return <PaymentForm {...props} />;
}; 