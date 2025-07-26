import React, { useState } from 'react';

function SendSmsForm() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Hello from Aijin!');
  const [status, setStatus] = useState('');

  // Function to call the backend API and send SMS
  const sendSMS = async (to, message) => {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, message }),
    });

    const data = await response.json();

    if (data.success) {
      setStatus('Message sent successfully!');
      console.log('Message SID:', data.sid);
    } else {
      setStatus(`Error: ${data.error}`);
      console.error('Error:', data.error);
    }
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    sendSMS(phoneNumber, message);
  };

  return (
    <div>
      <h1>Send SMS</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label htmlFor="message">Message:</label>
          <input
            type="text"
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message"
          />
        </div>
        <button type="submit">Send SMS</button>
      </form>

      {status && <p>{status}</p>}
    </div>
  );
}

export default SendSmsForm;
