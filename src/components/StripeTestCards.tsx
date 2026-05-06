import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface TestCard {
  number: string;
  name: string;
  description: string;
  type: 'success' | 'auth' | 'decline';
}

const TEST_CARDS: TestCard[] = [
  { number: "4242 4242 4242 4242", name: "Success", description: "Any expiry/CVC, successful payment", type: 'success' },
  { number: "4000 0000 0000 9995", name: "3DS Auth", description: "Triggers authentication challenge", type: 'auth' },
  { number: "4000 0000 0000 0002", name: "Decline", description: "Generic card decline", type: 'decline' },
  { number: "4000 0000 0000 0341", name: "Insufficient Funds", description: "Card declined - insufficient funds", type: 'decline' },
  { number: "5555 5555 5555 4444", name: "New Card", description: "Visa debit style", type: 'success' },
];

export default function StripeTestCards({ onFill }: { onFill: (card: TestCard) => void }) {
  const [copied, setCopied] = useState<string>('');

  const autofillStripe = async (card: TestCard) => {
    try {
      // Find Stripe checkout iframe
      const iframe = document.querySelector('iframe[src*="checkout.stripe.com"]') as HTMLIFrameElement;
      if (iframe && iframe.contentDocument) {
        const cardNumber = iframe.contentDocument.querySelector('input[name="cardnumber"]') as HTMLInputElement;
        const expiry = iframe.contentDocument.querySelector('input[name="exp-date"]') as HTMLInputElement;
        const cvc = iframe.contentDocument.querySelector('input[name="cvc"]') as HTMLInputElement;
        
        if (cardNumber) {
          cardNumber.value = card.number.replace(/ /g, '');
          cardNumber.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (expiry) {
          expiry.value = '12/34';
          expiry.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (cvc) {
          cvc.value = '123';
          cvc.dispatchEvent(new Event('input', { bubbles: true }));
        }
        alert(`${card.name} autofilled! (${card.number})`);
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(card.number);
        alert(`Copied ${card.name}: ${card.number} (paste manually)\nExpiry: 12/34, CVC: 123`);
      }
    } catch (error) {
      navigator.clipboard.writeText(card.number);
      alert(`Copied ${card.name} (iframe access blocked)\nPaste manually on Stripe page\nExpiry: 12/34, CVC: 123`);
    }
  };

  return (
    <Alert className="mt-4 border-emerald-200 bg-emerald-50">
      <Select onValueChange={(value) => {
        const card = TEST_CARDS.find(c => c.number === value);
        if (card) autofillStripe(card);
      }}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select test card → autofill Stripe checkout" />
        </SelectTrigger>
        <SelectContent>
          {TEST_CARDS.map((card) => (
            <SelectItem key={card.number} value={card.number}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{card.number}</span>
                <span className="text-xs font-medium">{card.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AlertDescription className="mt-2 text-xs text-emerald-700">
        Works after "Pay" opens Stripe. Auto-fills if possible, else copies. Full docs: STRIPE_TESTING.md
      </AlertDescription>
    </Alert>
  );
}

