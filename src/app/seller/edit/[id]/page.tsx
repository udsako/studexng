"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    condition: "",
    category: "",
    description: "",
    images: [],
  });

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem("sellerProducts") || "[]");
    const found = all.find((p: any) => p.id === id);
    if (found) setFormData(found);
  }, [id]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: any) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file: any) => URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...newImages],
    }));
  };

  const handleSave = () => {
    const all = JSON.parse(localStorage.getItem("sellerProducts") || "[]");
    const updated = all.map((p: any) => (p.id === id ? { ...formData, id } : p));
    localStorage.setItem("sellerProducts", JSON.stringify(updated));
    alert("Product updated successfully!");
    router.push(`/seller/listings/${id}`);
  };

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-white z-40 border-b">
        <div className="flex items-center justify-between p-4">
          <Link href={`/seller/listings/${id}`} className="text-purple-600">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: "#7C3AED" }}>
            Edit Product
          </h1>
          <div />
        </div>
      </div>

      <div className="p-4 pb-24 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price (₦)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Condition</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select</option>
              <option value="New">New</option>
              <option value="Used">Used</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Add Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="mt-1 w-full"
            />
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                {formData.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-purple-700"
          >
            Save Changes
          </button>
        </form>
      </div>
    </>
  );
}
