(function () {
  var config = {
    orderId: "TEST-001",
    amount: 100,
    currency: "RUB",
    service: "Разработка фирменного стиля",
    paymentApiUrl: ""
  };

  var payBtn = document.querySelector("[data-checkout-pay]");
  var note = document.querySelector("[data-checkout-note]");

  if (!payBtn) return;

  payBtn.addEventListener("click", function () {
    if (!config.paymentApiUrl) {
      if (note) {
        note.textContent =
          "Тестовая страница готова. После одобрения эквайринга сюда подключится API: создание платежа → payment_url → редирект.";
      }
      return;
    }

    payBtn.disabled = true;

    fetch(config.paymentApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: config.orderId,
        amount: config.amount,
        currency: config.currency,
        description: config.service
      })
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data && data.payment_url) {
          window.location.href = data.payment_url;
          return;
        }
        throw new Error("payment_url missing");
      })
      .catch(function () {
        payBtn.disabled = false;
        if (note) {
          note.textContent = "Не удалось создать платёж. Попробуйте позже.";
        }
      });
  });
})();
