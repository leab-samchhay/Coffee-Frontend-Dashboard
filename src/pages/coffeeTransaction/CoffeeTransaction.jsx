import React, { useEffect, useState } from 'react'
import { TranSactionCoffee } from '../../service/TranSactionCoffeeService';
import { CategoryService } from '../../service/CategoryService';
import { MdOutlineSaveAlt } from "react-icons/md";
import DiscoundService from '../../service/DiscoundService';

const initialFormState = {
    name: "",
    category_id: "",
    description: "",
    discound_item: "",
    tax_item: "",
    status: "",
    image: null,

    variants: [
        {
            size: "",
            price: "",
            status_variants: ""
        }
    ]
};

const CoffeeTransaction = () => {

    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState([]);
    const [discound,setDiscound] = useState([]);
    const [form, setForm] = useState(initialFormState);

    useEffect(() => {
        fetchCategory();
        fetchDiscound();
    }, []);

    const clear = () => {
        setForm(
            {
                name: "",
                category_id: "",
                description: "",
                discound_item: "",
                tax_item: "",
                status: "",
                image: null,

                variants: [
                    {
                        size: "",
                        price: "",
                        status_variants: ""
                    }
                ]
            }
        );
        
        const fileInput = document.getElementById('image');
        if (fileInput) {
            fileInput.value = "";
        }
    }

    const handleInput = async (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            setForm((pre) => ({ ...pre, [name]: files[0] || null }));
        } else {
            setForm((pre) => ({ ...pre, [name]: value }));
        }
    }

    const fetchDiscound = async () => {
        try {
            const res = await DiscoundService.getAll(1, 1000);
            
            const data = res?.data || [];
            setDiscound(data);
        } catch (err) {
            console.log(err);
        }
    }

    const handleVariantChange = (index, e) => {
        const { name, value } = e.target;
        const updatedVariants = [...form.variants];
        updatedVariants[index][name] = value;
        setForm((pre) => ({ ...pre, variants: updatedVariants }));
    };

    // មុខងារសម្រាប់បន្ថែម Variant ថ្មី
    const addVariant = () => {
        setForm((pre) => ({
            ...pre,
            variants: [
                ...pre.variants,
                { size: "", price: "", status_variants: "" }
            ]
        }));
    };

    // មុខងារសម្រាប់លុប Variant តាម Index (កំណត់យ៉ាងហោចណាស់ឲ្យសល់ ១)
    const removeVariant = (index) => {
        if (form.variants.length === 1) return; 
        const updatedVariants = form.variants.filter((_, i) => i !== index);
        setForm((pre) => ({ ...pre, variants: updatedVariants }));
    };

    const fetchCategory = async () => {
        try {
            const res = await CategoryService.getAll({ per_page: -1 });
            const categoryData = Array.isArray(res) ? res : (res?.data || []);
            setCategory(categoryData);
        } catch (error) {
            console.log(error);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('discound_item', form.discound_item);
            formData.append('tax_item', form.tax_item);
            formData.append('category_id', form.category_id);
            formData.append('discription', form.description);
            formData.append('status', form.status);
            
            if (form.image) {
                formData.append('image', form.image);
            }

            // បញ្ជូន Variants ទាំងអស់ទៅកាន់ Laravel Controller តាមរយះ FormData
            form.variants.forEach((variant, index) => {
                formData.append(`variants[${index}][size]`, variant.size);
                formData.append(`variants[${index}][price]`, variant.price);
                formData.append(`variants[${index}][status_variants]`, variant.status_variants);
            });

            const res = await TranSactionCoffee.Create(formData);
            console.log("Success:", res.data);
            clear();
        } catch (error) {
            console.log("Error:", error.response?.data || error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm px-5 py-4">
            
                <div className="text-black/70 font-medium text-xl mb-4">
                    Create Coffee Transaction
                </div>

                <div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="text-sm font-semibold text-gray-700 block mb-1">
                                Name
                            </label>
                            <input 
                                type="text"
                                name="name"
                                id="name"
                                value={form.name}
                                onChange={handleInput}
                                placeholder="Enter name..."
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400" 
                            />
                        </div>
    
                        <div>
                            <label htmlFor="category_id" className="text-sm font-semibold text-gray-700 block mb-1">
                                Category
                            </label>
                            <select 
                                name="category_id"
                                id="category_id"
                                value={form.category_id}
                                onChange={handleInput}
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                            >
                                <option value="" disabled>Select Category</option>
                                {category.map((cat,index) => (
                                    <option key={cat.id} value={cat.id}>
                                        <span>
                                            {index+1} - {cat.name}
                                        </span>
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="discound_item" className="text-sm font-semibold text-gray-700 block mb-1">
                                Discound
                            </label>
                            <select
                                name="discound_item"
                                id="discound_item"
                                value={form.discound_item}
                                onChange={handleInput}
                                required
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                            >
                                <option value="" disabled>Select discound</option>
                                {discound.map((cat, index) => (
                                    <option key={cat.id} value={cat.id}>
                                        Discound {cat.qty_percent}%  ({cat.start_date} to {cat.end_date})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="tax_item" className="text-sm font-semibold text-gray-700 block mb-1">
                                Tax
                            </label>
                            <input 
                                type="text"
                                name="tax_item"
                                id="tax_item"
                                value={form.tax_item}
                                onChange={handleInput}
                                placeholder="Enter tax"
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400" 
                            />
                        </div>

                        <div>
                            <label htmlFor="image" className="text-sm font-semibold text-gray-700 block mb-1">
                                Image
                            </label>
                            <input 
                                type="file"
                                name="image"
                                id="image"
                                accept="image/*"
                                onChange={handleInput}
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer" 
                            />

                            {form.image && (
                                <div className="mt-3 relative w-32 h-32 border border-gray-200 rounded-md overflow-hidden bg-gray-50 shadow-sm flex items-center justify-center">
                                    <img 
                                        src={form.image instanceof File || form.image instanceof Blob ? URL.createObjectURL(form.image) : ''} 
                                        alt="Image Preview" 
                                        className="object-cover w-full h-full"
                                    />
                                    
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm((pre) => ({ ...pre, image: null }));
                                            const fileInput = document.getElementById('image');
                                            if (fileInput) fileInput.value = "";
                                        }}
                                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow transition-all cursor-pointer"
                                        title="Remove image"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="status" className="text-sm font-semibold text-gray-700 block mb-1">
                                Status
                            </label>
                            <select 
                                name="status"
                                id="status"
                                value={form.status}
                                onChange={handleInput}
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                            >
                                <option value="" disabled>Select status...</option>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>

                        <div className="border border-gray-200 bg-gray-50/50 p-4 rounded-xl space-y-4 shadow-xs">
                            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800">Coffee Variants</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-sm shadow-sm transition-all duration-200 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
                                    </svg>
                                    Add Variant
                                </button>
                            </div>

                            <div className="space-y-3">
                                {form.variants.map((variant, index) => (
                                    <div 
                                        key={index} 
                                        className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3.5 border border-gray-200 rounded-lg shadow-xs hover:border-emerald-300 transition-all duration-200 group"
                                    >
                                        {/* លេខរៀង Variant */}
                                        <span className="absolute -top-2.5 left-3 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                            Variant #{index + 1}
                                        </span>

                                        {/* Size Input */}
                                        <div className="w-full sm:flex-1 pt-1 sm:pt-0">
                                            <label className="text-xs font-medium text-gray-600 block mb-1">Size</label>
                                            <input 
                                                type="text"
                                                name="size"
                                                value={variant.size}
                                                onChange={(e) => handleVariantChange(index, e)}
                                                placeholder="e.g. Medium, Large"
                                                className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50/50 border border-gray-300 rounded-md outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                                            />
                                        </div>

                                        {/* Price Input */}
                                        <div className="w-full sm:flex-1">
                                            <label className="text-xs font-medium text-gray-600 block mb-1">Price ($)</label>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                name="price"
                                                value={variant.price}
                                                onChange={(e) => handleVariantChange(index, e)}
                                                placeholder="e.g. 3.50"
                                                className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50/50 border border-gray-300 rounded-md outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                                            />
                                        </div>

                                        {/* Status Select */}
                                        <div className="w-full sm:flex-1">
                                            <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                                            <select 
                                                name="status_variants"
                                                value={variant.status_variants}
                                                onChange={(e) => handleVariantChange(index, e)}
                                                className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50/50 border border-gray-300 rounded-md outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                                            >
                                                <option value="" disabled>Select status...</option>
                                                <option value="1">Active</option>
                                                <option value="0">Inactive</option>
                                            </select>
                                        </div>

                                        {/* Delete Button */}
                                        {form.variants.length > 1 && (
                                            <div className="w-full sm:w-auto flex justify-end sm:pt-5">
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariant(index)}
                                                    className="flex items-center justify-center w-9 h-9 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-200 rounded-md transition-all duration-200 cursor-pointer shadow-2xs"
                                                    title="Delete Variant"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
    
                        <div>
                            <label htmlFor="description" className="text-sm font-semibold text-gray-700 block mb-1">
                                Description
                            </label>
                            <textarea 
                                name="description"
                                id="description"
                                rows="4"
                                value={form.description}
                                onChange={handleInput}
                                placeholder="Enter category description..."
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400 resize-none"
                            />
                        </div>
    
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex items-center justify-center min-w-[120px] px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium text-sm rounded-sm shadow-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? "Saving..." : 
                                <div className='flex items-center gap-4'> 
                                    <span>Save</span> 
                                    <MdOutlineSaveAlt className="text-base" /> 
                                </div>
                            }
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CoffeeTransaction