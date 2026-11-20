import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseService } from '../../service/PurchaseService';
import { IoMdAddCircleOutline } from "react-icons/io";
import { MdClear } from "react-icons/md";
import { IoSearchOutline, IoClose } from "react-icons/io5";
import { FiEye, FiEdit3 } from 'react-icons/fi';
import { RiDeleteBinLine } from 'react-icons/ri';

const PER_PAGE_OPTIONS = [5, 10, 20, 50];

const PurchaseTransactionList = () => {
    // --- State Management ---
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [selectedPurchase, setSelectedPurchase] = useState(null); // For details modal
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        from: 0,
        to: 0,
        total: 0
    });

    const navigate = useNavigate();

    // --- API Calls ---
    const fetchPurchases = async (page = 1, limit = perPage, searchVal = searchTerm) => {
        try {
            setLoading(true);
            const res = await PurchaseService.getAll(page, limit, searchVal);
            if (res && res.data) {
                setPurchases(res.data);
                setPagination({
                    currentPage: res.current_page || 1,
                    lastPage: res.last_page || 1,
                    from: res.from || 0,
                    to: res.to || 0,
                    total: res.total || 0
                });
            } else if (Array.isArray(res)) {
                setPurchases(res);
            }
        } catch (error) {
            console.error("Error fetching purchases:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Event Handlers ---
    const handleDelete = async (id) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this purchase transaction?");
        if (!isConfirmed) return;

        try {
            setLoading(true);
            await PurchaseService.deletes(id);
            const targetPage = purchases.length === 1 && pagination.currentPage > 1
                ? pagination.currentPage - 1
                : pagination.currentPage;
            fetchPurchases(targetPage, perPage, searchTerm);
        } catch (error) {
            console.error("Error deleting purchase transaction:", error);
            setLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handlePerPageChange = (e) => {
        setPerPage(Number(e.target.value));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchPurchases(newPage, perPage, searchTerm);
        }
    };

    // --- Effects ---
    useEffect(() => {
        const delayTimer = setTimeout(() => {
            fetchPurchases(1, perPage, searchTerm);
        }, 400);

        return () => clearTimeout(delayTimer);
    }, [searchTerm, perPage]);

    return (
        <div className="">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">

                {/* 1. Header & Filters Section */}
                <div className="bg-white px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-gray-800 font-semibold text-xl">
                            Purchase Transactions
                        </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-end">
                        {/* Search Input */}
                        <div className="relative flex items-center w-full sm:w-64">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search invoice or supplier..."
                                className="w-full border border-gray-300 bg-white text-gray-800 text-sm px-4 py-2 pr-10 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all placeholder:text-gray-400 h-[38px]"
                            />
                            <div className="absolute right-3 flex items-center text-gray-400">
                                {searchTerm ? (
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
                                name="per-page"
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

                        {/* Create Transaction Button */}
                        <button
                            type="button"
                            onClick={() => navigate('/purchaseTransaction/create')}
                            className="flex-1 sm:flex-initial flex items-center justify-center h-[38px] whitespace-nowrap flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            <span className="text-lg leading-none">
                                <IoMdAddCircleOutline />
                            </span>
                            <span>New Purchase</span>
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
                                        <th className="py-3 px-5">Invoice No</th>
                                        <th className="py-3 px-5">Supplier</th>
                                        <th className="py-3 px-5">Date</th>
                                        <th className="py-3 px-5 text-center">Items</th>
                                        <th className="py-3 px-5">Total</th>
                                        <th className="py-3 px-5">Discount</th>
                                        <th className="py-3 px-5">Grand Total</th>
                                        <th className="py-3 px-5">Status</th>
                                        <th className="py-3 px-5 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {purchases.length > 0 ? (
                                        purchases.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50/80 transition-colors duration-150"
                                            >
                                                <td className="py-3.5 px-5 font-medium text-gray-900">
                                                    {(pagination.from || 1) + index}
                                                </td>
                                                <td className="py-3.5 px-5 font-semibold text-emerald-800">
                                                    {item.invoice_number}
                                                </td>
                                                <td className="py-3.5 px-5 font-medium text-gray-900">
                                                    {item.supplier?.name || "N/A"}
                                                </td>
                                                <td className="py-3.5 px-5 text-gray-600 whitespace-nowrap">
                                                    {item.purchase_date}
                                                </td>
                                                <td className="py-3.5 px-5 text-center">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                                        {item.details?.length || 0} items
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 text-gray-700">
                                                    ${Number(item.total_amount || 0).toFixed(2)}
                                                </td>
                                                <td className="py-3.5 px-5 text-rose-600">
                                                    -${Number(item.discount || 0).toFixed(2)}
                                                </td>
                                                <td className="py-3.5 px-5 font-bold text-emerald-700">
                                                    ${Number(item.grand_total || 0).toFixed(2)}
                                                </td>
                                                <td className="py-3.5 px-5">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                            item.status === 1 || item.status === '1'
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                                                        }`}
                                                    >
                                                        {item.status === 1 || item.status === '1'
                                                            ? 'Completed'
                                                            : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 text-end space-x-2 whitespace-nowrap">
                                                    {/* View Details Button */}
                                                    <button
                                                        type="button"
                                                        title="View Purchase Details"
                                                        onClick={() => setSelectedPurchase(item)}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all cursor-pointer shadow-sm"
                                                    >
                                                        <FiEye className="text-base" />
                                                    </button>
                                                    {/* Edit Button */}
                                                    <button
                                                        type="button"
                                                        title="Edit Purchase"
                                                        onClick={() => navigate(`/purchaseTransaction/edit/${item.id}`)}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer shadow-sm"
                                                    >
                                                        <FiEdit3 className="text-base" />
                                                    </button>
                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        title="Delete Purchase"
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
                                            <td colSpan="10" className="py-12 text-center text-gray-400">
                                                No purchase transactions found
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

            {/* 4. Modal: Purchase Details View */}
            {selectedPurchase && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50/70">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    Invoice: {selectedPurchase.invoice_number}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Date: {selectedPurchase.purchase_date} | Supplier: {selectedPurchase.supplier?.name || "N/A"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPurchase(null)}
                                className="text-gray-400 hover:text-gray-700 text-xl p-1 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                <IoClose />
                            </button>
                        </div>

                        {/* Modal Content / Items Table */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Purchased Ingredients ({selectedPurchase.details?.length || 0})
                            </h4>

                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
                                            <th className="py-2.5 px-4">#</th>
                                            <th className="py-2.5 px-4">Ingredient</th>
                                            <th className="py-2.5 px-4">Unit</th>
                                            <th className="py-2.5 px-4 text-end">Quantity</th>
                                            <th className="py-2.5 px-4 text-end">Unit Price</th>
                                            <th className="py-2.5 px-4 text-end">Total Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedPurchase.details && selectedPurchase.details.length > 0 ? (
                                            selectedPurchase.details.map((detail, idx) => (
                                                <tr key={detail.id || idx} className="hover:bg-gray-50">
                                                    <td className="py-2.5 px-4 text-gray-500">{idx + 1}</td>
                                                    <td className="py-2.5 px-4 font-medium text-gray-800">
                                                        {detail.ingredient?.name || `Ingredient #${detail.ingredients_id}`}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-gray-600">{detail.unite}</td>
                                                    <td className="py-2.5 px-4 text-end font-semibold text-gray-800">
                                                        {detail.quantity}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-end text-gray-700">
                                                        ${Number(detail.unit_price || 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-end font-bold text-gray-900">
                                                        ${Number(detail.total_price || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="py-6 text-center text-gray-400">
                                                    No details available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Totals in Modal */}
                            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center text-sm">
                                <div className="space-y-1 text-gray-600">
                                    <div>Total Amount: <span className="font-semibold text-gray-800">${Number(selectedPurchase.total_amount || 0).toFixed(2)}</span></div>
                                    <div>Discount: <span className="font-semibold text-rose-600">-${Number(selectedPurchase.discount || 0).toFixed(2)}</span></div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500 block uppercase font-medium">Grand Total</span>
                                    <span className="text-xl font-extrabold text-emerald-700">
                                        ${Number(selectedPurchase.grand_total || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    const id = selectedPurchase.id;
                                    setSelectedPurchase(null);
                                    navigate(`/purchaseTransaction/edit/${id}`);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <FiEdit3 className="text-base" />
                                <span>Edit This Purchase</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedPurchase(null)}
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

export default PurchaseTransactionList;
