import { useState } from "react";
import Swal from "sweetalert2";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    place: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  const whatsappNumber = "919645838555";

  const message = `
*Study2India New Enquiry*

*Name:* ${formData.name}
*Email:* ${formData.email}
*Phone:* ${formData.phone}
*Place:* ${formData.place}

*Message:*
${formData.message}
`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  await Swal.fire({
    title: "Redirecting to WhatsApp",
    text: "Please send the message in WhatsApp.",
    icon: "success",
    timer: 1000,
    showConfirmButton: false,
  });

  window.open(whatsappUrl, "_blank");

  setFormData({
    name: "",
    email: "",
    phone: "",
    place: "",
    message: "",
  });
};

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-8 text-center text-3xl font-bold">Contact Form</h2>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="name"
            placeholder="Your Name"
            className="rounded-lg border p-3"
          />

          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="Email Address"
            className="rounded-lg border p-3"
          />

          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            required
            autoComplete="tel"
            placeholder="Phone Number"
            className="rounded-lg border p-3"
          />

          <input
            name="place"
            value={formData.place}
            onChange={handleChange}
            required
            autoComplete="address-level2"
            placeholder="Place"
            className="rounded-lg border p-3"
          />

          <textarea
            name="message"
            rows="6"
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Your Message"
            className="rounded-lg border p-3 md:col-span-2"
          />

          <div className="flex justify-center md:col-span-2 md:justify-end">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-8 py-3 text-white transition hover:bg-slate-700"
            >
              Send via WhatsApp
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}