import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExchangeService } from '../../service/ExchangeService';
import { IoMdAddCircleOutline } from "react-icons/io";
import { MdClear } from "react-icons/md";
import { IoSearchOutline } from "react-icons/io5";
import { FiEdit3 } from 'react-icons/fi';
import { RiDeleteBinLine } from 'react-icons/ri';

const PER_PAGE_OPTIONS = [5, 10, 20, 50];

const ExchangeList = () => {
    // --- State Management ---
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        from: 0,
        to: 0,
        total: 0
    });

    const navigate = useNavigate();

    // --- API Calls ---
    const fetchExchanges = async (page = 1, limit = perPage, searchVal = searchTerm) => {
        try {
            setLoading(true);
            const res = await ExchangeService.getAll(page, limit, searchVal);
            if (res && res.data) {
                setExchanges(res.data);
                setPagination({
                    currentPage: res.current_page || 1,
                    lastPage: res.last_page || 1,
                    from: res.from || 0,
                    to: res.to || 0,
                    total: res.total || 0
                });
            } else if (Array.isArray(res)) {
                setExchanges(res);
            }
        } catch (error) {
            console.error("Error fetching exchange rates:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Event Handlers ---
    const handleDelete = async (id) => {
        const isConfirmed = window.confirm("Do you want to delete this exchange rate record?");
        if (!isConfirmed) return;

        try {
            setLoading(true);
            await ExchangeService.deletes(id);
            const targetPage = exchanges.length === 1 && pagination.currentPage > 1
                ? pagination.currentPage - 1
                : pagination.currentPage;
            fetchExchanges(targetPage, perPage, searchTerm);
        } catch (error) {
            console.error("Error deleting exchange rate:", error);
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
            fetchExchanges(newPage, perPage, searchTerm);
        }
    };

    // --- Effects ---
    useEffect(() => {
        const delayTimer = setTimeout(() => {
            fetchExchanges(1, perPage, searchTerm);
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
                            Exchange Rate Management
                        </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-end">
                        {/* Search Input */}
                        <div className="relative flex items-center w-full sm:w-64">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search date or rate..."
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

                        {/* Add New Button */}
                        <button
                            type="button"
                            onClick={() => navigate('/exchanges/create')}
                            className="flex-1 sm:flex-initial  justify-center h-[38px] whitespace-nowrap flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-all duration-200 cursor-pointer"
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
                                        <th className="py-3 px-6 w-16">No</th>
                                        <th className="py-3 px-6">Date</th>
                                        <th className="py-3 px-6">Exchange Rate</th>
                                        <th className="py-3 px-6">Created At</th>
                                        <th className="py-3 px-6 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {exchanges.length > 0 ? (
                                        exchanges.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50/80 transition-colors duration-150"
                                            >
                                                <td className="py-3.5 px-6 font-medium text-gray-900">
                                                    {(pagination.from || 1) + index}
                                                </td>
                                                <td className="py-3.5 px-6 font-semibold text-gray-800">
                                                    {item.date}
                                                </td>
                                                <td className="py-3.5 px-6 font-bold text-emerald-700">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {Number(item.rate).toLocaleString()} ៛ / $
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-6 text-gray-500 text-xs">
                                                    {item.created_at ? new Date(item.created_at).toLocaleString() : "N/A"}
                                                </td>
                                                <td className="py-3.5 px-6 text-end space-x-2 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        title="Edit Exchange Rate"
                                                        onClick={() => navigate(`/exchanges/edit/${item.id}`)}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer shadow-sm"
                                                    >
                                                        <FiEdit3 className="text-base" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Delete Exchange Rate"
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
                                            <td colSpan="5" className="py-12 text-center text-gray-400">
                                                No exchange rates found
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
        </div>
    );
};

export default ExchangeList;
