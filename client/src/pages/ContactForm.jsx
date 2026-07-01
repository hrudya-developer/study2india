import { useState } from "react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    place: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send message");
      }

      await Swal.fire({
        title: "Success!",
        text: "Message sent successfully",
        icon: "success",
        confirmButtonText: "OK",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        place: "",
        message: "",
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        title: "Server Error!",
        text: "Unable to send message. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-8 text-center text-3xl font-bold">Contact Form</h2>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <input name="name" value={formData.name} onChange={handleChange} required placeholder="Your Name" className="rounded-lg border p-3" />
          <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="Email Address" className="rounded-lg border p-3" />
          <input name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="Phone Number" className="rounded-lg border p-3" />
          <input name="place" value={formData.place} onChange={handleChange} required placeholder="Place" className="rounded-lg border p-3" />

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
              disabled={loading}
              className="rounded-lg bg-slate-900 px-8 py-3 text-white disabled:opacity-60"
            >
              {loading ? "Sending..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}