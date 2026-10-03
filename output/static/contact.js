(function () {
  "use strict";

  const form = document.getElementById("contact-form");
  const subject = document.getElementById("contact-subject");
  const message = document.getElementById("contact-message");
  const gmailLink = document.getElementById("gmail-draft-link");
  const draftStatus = document.getElementById("contact-draft-status");
  const copyButton = document.getElementById("copy-email-address");
  const addressLink = document.getElementById("contact-email-address");
  const copyStatus = document.getElementById("contact-copy-status");
  const address = "ncmatholy@gmail.com";

  if (!form || !subject || !message || !gmailLink || !draftStatus || !copyButton || !addressLink || !copyStatus) return;

  function draftSubject() {
    return subject.value.trim() || "NC(J)MO inquiry";
  }

  function updateGmailLink() {
    const draft = new URL("https://mail.google.com/mail/");
    draft.searchParams.set("view", "cm");
    draft.searchParams.set("fs", "1");
    draft.searchParams.set("to", address);
    draft.searchParams.set("su", draftSubject());
    draft.searchParams.set("body", message.value);
    gmailLink.href = draft.href;
  }

  form.addEventListener("input", function () {
    updateGmailLink();
    draftStatus.textContent = "";
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const mailto = "mailto:" + address + "?subject=" + encodeURIComponent(draftSubject()) + "&body=" + encodeURIComponent(message.value);
    draftStatus.textContent = "Review and send the draft in your email app. If it didn’t open, use Gmail or copy the email address.";
    window.open(mailto, "_blank", "noopener");
  });

  gmailLink.addEventListener("click", function () {
    updateGmailLink();
    draftStatus.textContent = "Review and send your draft in Gmail. Your message stays here if you need to try another option.";
  });

  copyButton.addEventListener("click", async function () {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(address);
      copyStatus.textContent = "Email address copied.";
    } catch (_) {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(addressLink);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      copyStatus.textContent = "Select and copy the email address above: ncmatholy@gmail.com.";
      addressLink.focus();
    }
  });

  updateGmailLink();
  form.hidden = false;
  copyButton.hidden = false;
})();
