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

      const response = await fetch(
        "http://localhost:5000/send-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );


      const data = await response.json();


      if (data.success) {

        Swal.fire({
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


      } else {

        Swal.fire({
          title: "Error!",
          text: "Failed to send message",
          icon: "error",
          confirmButtonText: "Try Again",
        });

      }


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
    <section className="max-w-5xl mx-auto px-6 py-10">

      <div className="rounded-xl bg-white shadow-lg p-8">

        <h2 className="text-3xl font-bold text-center mb-8">
          Contact Form
        </h2>


        <form
          onSubmit={handleSubmit}
          className="grid gap-6 md:grid-cols-2"
        >


          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />


          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />


          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />


          <input
            type="text"
            name="place"
            placeholder="Place"
            value={formData.place}
            onChange={handleChange}
            required
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />


          <textarea
            name="message"
            placeholder="Your Message"
            rows="6"
            value={formData.message}
            onChange={handleChange}
            required
            className="md:col-span-2 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />


<div className="md:col-span-2 flex justify-center md:justify-end">
  <button
    type="submit"
    disabled={loading}
    className="bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
  >
    {loading ? "Sending..." : "Submit"}
  </button>
</div>


        </form>

      </div>

    </section>
  );
}