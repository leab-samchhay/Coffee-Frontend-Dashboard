import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoffeeService } from "../../service/CoffeeService";
import { IoMdAddCircleOutline } from "react-icons/io";
import { MdClear } from "react-icons/md";
import { IoSearchOutline, IoClose } from "react-icons/io5";
import { FiEye, FiEdit3 } from 'react-icons/fi';
import { RiDeleteBinLine } from 'react-icons/ri';

const PER_PAGE_OPTIONS = [5, 10, 20, 50];
const ImageUrl = "http://127.0.0.1:8000/storage/";

const CoffeeList = () => {
    // --- State Management ---
    const [coffeeData, setCoffeeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [selectedCoffee, setSelectedCoffee] = useState(null); // For details modal
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        from: 0,
        to: 0,
        total: 0
    });

    const navigate = useNavigate();

    // --- API Calls ---
    const fetchCoffee = async (page = 1, limit = perPage, searchVal = search) => {
        try {
            setLoading(true);
            const res = await CoffeeService.getAll(page, limit, searchVal);
            if (res && res.data) {
                setCoffeeData(res.data);
                setPagination({
                    currentPage: res.current_page || 1,
                    lastPage: res.last_page || 1,
                    from: res.from || 0,
                    to: res.to || 0,
                    total: res.total || 0
                });
            } else if (Array.isArray(res)) {
                setCoffeeData(res);
            }
        } catch (error) {
            console.error("Error fetching coffee data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Event Handlers ---
    const handleDelete = async (id) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this coffee?");
        if (!isConfirmed) return;

        try {
            setLoading(true);
            await CoffeeService.deletes(id);
            const targetPage = coffeeData.length === 1 && pagination.currentPage > 1
                ? pagination.currentPage - 1
                : pagination.currentPage;
            fetchCoffee(targetPage, perPage, search);
        } catch (error) {
            console.error("Error deleting coffee:", error);
            setLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
    };

    const handlePerPageChange = (e) => {
        setPerPage(Number(e.target.value));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchCoffee(newPage, perPage, search);
        }
    };

    // --- Effects ---
    useEffect(() => {
        const delayTimer = setTimeout(() => {
            fetchCoffee(1, perPage, search);
        }, 400);

        return () => clearTimeout(delayTimer);
    }, [search, perPage]);

    return (
        <div className="">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">

                {/* 1. Header & Filters Section */}
                <div className="bg-white px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-gray-800 font-semibold text-xl">
                            Coffee Management
                        </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-end">
                        {/* Search Input */}
                        <div className="relative flex items-center w-full sm:w-64">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search coffee name..."
                                className="w-full border border-gray-300 bg-white text-gray-800 text-sm px-4 py-2 pr-10 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all placeholder:text-gray-400 h-[38px]"
                            />
                            <div className="absolute right-3 flex items-center text-gray-400">
                                {search ? (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        title="Clear search"
                                        className="hover:text-gray-600 cursor-pointer transition-colors"
                                    >
                                        <MdClear size={18} />
                                    </button>
                                ) : (
                                    <IoSearchOutline size={18} />
                                )}
                            </div>
                        </div>

                        {/* Per Page Select */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Per Page Select */}
                        <div className="relative flex-1 sm:flex-initial">
                            <select
                                id="per-page"
                                name="perPage"
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="w-full sm:w-auto text-center sm:text-left h-[38px] border border-gray-300 bg-white text-gray-800 text-sm px-3 py-2 rounded-md cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all"
                            >
                                {PER_PAGE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option} per page
                                    </option>
                                ))} 
                            </select>
                        </div>

                        {/* Add New Button */}
                        <button
                            type="button"
                            onClick={() => navigate('/coffee/create')}
                            className="flex-1 sm:flex-initial flex items-center justify-center h-[38px] whitespace-nowrap  gap-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            <span className="text-lg leading-none">
                                <IoMdAddCircleOutline />
                            </span>
                            <span>Add New</span>
                        </button>
                        </div>
                    </div>
                </div>

                {/* 2. Table Content Section */}
                <div className="relative min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                            <p className="text-sm font-medium text-gray-500 animate-pulse">
                                Loading Data...
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        <th className="py-3 px-5 w-14">No</th>
                                        <th className="py-3 px-5">Image</th>
                                        <th className="py-3 px-5">Name</th>
                                        <th className="py-3 px-5">Category</th>
                                        <th className="py-3 px-5 text-center">Variants</th>
                                        <th className="py-3 px-5">Discound</th>
                                        <th className="py-3 px-5">Tax</th>
                                        <th className="py-3 px-5">Description</th>
                                        <th className="py-3 px-5">Status</th>
                                        <th className="py-3 px-5 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {coffeeData.length > 0 ? (
                                        coffeeData.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50/80 transition-colors duration-150"
                                            >
                                                <td className="py-3.5 px-5 font-medium text-gray-900">
                                                    {(pagination.from || 1) + index}
                                                </td>

                                                <td className="py-3.5 px-5">
                                                    {item.image ? (
                                                        <img 
                                                            src={item.image.startsWith("http") ? item.image : `${ImageUrl}${item.image}`} 
                                                            alt={item.name} 
                                                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-2xs"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold border border-gray-200">
                                                            No Pic
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-5 font-semibold text-gray-900">
                                                    {item.name}
                                                </td>

                                                <td className="py-3.5 px-5 font-medium text-gray-700">
                                                    {item.category?.name || "N/A"}
                                                </td>

                                                <td className="py-3.5 px-5 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {item.variants?.length || 0} variants
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-5 text-gray-500 max-w-xs truncate" title={item.discound_item || item.discound_item}>
                                                    {item.discound?.qty_percent || "0"} %
                                                </td>

                                                <td className="py-3.5 px-5 text-gray-500 max-w-xs truncate" title={item.tax_item || item.tax_item}>
                                                    {item.tax_item || item.tax_item || "0"} %
                                                </td>

                                                <td className="py-3.5 px-5 text-gray-500 max-w-xs truncate" title={item.discription || item.description}>
                                                    {item.discription || item.description || "N/A"}
                                                </td>
                                                

                                                <td className="py-3.5 px-5">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                            item.status === 1 || item.status === '1' || item.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                                                        }`}
                                                    >
                                                        {item.status === 1 || item.status === '1' || item.status === 'active'
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-5 text-end space-x-2 whitespace-nowrap">
                                                    {/* View Details Button */}
                                                    <button
                                                        type="button"
                                                        title="View Coffee Details"
                                                        onClick={() => setSelectedCoffee(item)}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all cursor-pointer shadow-sm"
                                                    >
                                                        <FiEye className="text-base" />
                                                    </button>

                                                    {/* Edit Button */}
                                                    <button
                                                        type="button"
                                                        title="Edit Coffee"
                                                        onClick={() => navigate(`/coffee/edit/${item.id}`)}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer shadow-sm"
                                                    >
                                                        <FiEdit3 className="text-base" />
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        title="Delete Coffee"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer shadow-sm"
                                                    >
                                                        <RiDeleteBinLine className="text-base" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-gray-400">
                                                No coffees found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 3. Pagination Footer Section */}
                <div className="flex flex-col sm:flex-row justify-between items-center py-3 px-6 gap-3 border-t border-gray-200 bg-gray-50/50">
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-medium text-gray-900">{pagination.from || 0}</span> to{' '}
                        <span className="font-medium text-gray-900">{pagination.to || 0}</span> of{' '}
                        <span className="font-medium text-gray-900">{pagination.total || 0}</span> results
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={pagination.currentPage <= 1 || loading}
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-gray-700 px-2 font-medium">
                            Page {pagination.currentPage} of {pagination.lastPage || 1}
                        </span>

                        <button
                            type="button"
                            disabled={pagination.currentPage >= pagination.lastPage || loading}
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </div>

            </div>

            {/* 4. Modal: Coffee Details View */}
            {selectedCoffee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50/70">
                            <div className="flex items-center gap-3">
                                {selectedCoffee.image ? (
                                    <img 
                                        src={selectedCoffee.image.startsWith("http") ? selectedCoffee.image : `${ImageUrl}${selectedCoffee.image}`} 
                                        alt={selectedCoffee.name} 
                                        className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-xs"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                                        ☕
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {selectedCoffee.name}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Category: <span className="font-medium text-gray-700">{selectedCoffee.category?.name || "N/A"}</span> | 
                                        Status: <span className={`font-semibold ml-1 ${selectedCoffee.status === 1 || selectedCoffee.status === '1' || selectedCoffee.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {selectedCoffee.status === 1 || selectedCoffee.status === '1' || selectedCoffee.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCoffee(null)}
                                className="text-gray-400 hover:text-gray-700 text-xl p-1 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                <IoClose />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            {/* Description */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    Description
                                </h4>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    {selectedCoffee.discription || selectedCoffee.description || "No description provided."}
                                </p>
                            </div>

                            {/* Variants Table */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Available Variants ({selectedCoffee.variants?.length || 0})
                                </h4>
                                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
                                                <th className="py-2.5 px-4 w-12">#</th>
                                                <th className="py-2.5 px-4">Size</th>
                                                <th className="py-2.5 px-4">Price</th>
                                                <th className="py-2.5 px-4 text-end">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedCoffee.variants && selectedCoffee.variants.length > 0 ? (
                                                selectedCoffee.variants.map((v, idx) => (
                                                    <tr key={v.id || idx} className="hover:bg-gray-50">
                                                        <td className="py-2.5 px-4 text-gray-500">{idx + 1}</td>
                                                        <td className="py-2.5 px-4 font-semibold text-gray-800">
                                                            {v.size || "Standard"}
                                                        </td>
                                                        <td className="py-2.5 px-4 font-bold text-emerald-700">
                                                            ${Number(v.price || 0).toFixed(2)}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-end">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                v.status_variants === 1 || v.status_variants === '1'
                                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                                                            }`}>
                                                                {v.status_variants === 1 || v.status_variants === '1' ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="py-6 text-center text-gray-400">
                                                        No variants configured for this coffee
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    const id = selectedCoffee.id;
                                    setSelectedCoffee(null);
                                    navigate(`/coffee/edit/${id}`);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <FiEdit3 className="text-base" />
                                <span>Edit This Coffee</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedCoffee(null)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-md transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CoffeeList;
