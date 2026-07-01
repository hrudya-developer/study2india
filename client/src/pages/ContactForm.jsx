import { useState } from "react";
import Swal from "sweetalert2";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned HTML instead of JSON");
      }

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
      console.log(error);

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
        <h2 className="mb-8 text-center text-3xl font-bold">
          Contact Form
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="name"
            className="rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            autoComplete="tel"
            className="rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="place"
            placeholder="Place"
            value={formData.place}
            onChange={handleChange}
            required
            autoComplete="address-level2"
            className="rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            name="message"
            placeholder="Your Message"
            rows="6"
            value={formData.message}
            onChange={handleChange}
            required
            className="rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
          />

          <div className="flex justify-center md:col-span-2 md:justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-8 py-3 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}