function buildSupportedPaymentMethodData() {
  // Example supported payment methods:
  return [{
    supportedMethods: 'basic-card',
    data: {
      supportedNetworks: ['visa', 'mastercard'],
      supportedTypes: ['debit', 'credit']
    }
  }];
}

function buildShoppingCartDetails() {
  // Hardcoded for demo purposes:
  return {
    id: 'awesome video',
    displayItems: [
      {
        label: 'Ads, Micropayments, and the Missing Middle',
        amount: {currency: 'USD', value: '0.05'}
      }
    ],
    total: {
      label: 'Total',
      amount: {currency: 'USD', value: '0.05'}
    }
  };
}

// Payment request data
function showRequest() {
  var methodData = buildSupportedPaymentMethodData();
  var details = buildShoppingCartDetails();
  var request = new PaymentRequest(methodData, details);
  request.show();
}