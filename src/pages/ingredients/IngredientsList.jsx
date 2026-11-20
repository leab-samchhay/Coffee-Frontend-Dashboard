import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IngredientService } from "../../service/IngredientService";
import { IoMdAddCircleOutline } from "react-icons/io";
import { MdClear } from "react-icons/md";
import { IoSearchOutline } from "react-icons/io5";
import { FiEdit3 } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";

const IngredientsList = () => {
  const PER_PAGE_OPTIONS = [5, 10, 20, 50];
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const navigate = useNavigate();
  const [search, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    from: 0,
    to: 0,
    total: 0,
  });

  const fetchIngredients = useCallback(
    async (page = 1, limit = perPage, searchVal = search) => {
      try {
        setLoading(true);
        const res = await IngredientService.getAll(page, limit, searchVal);

        if (res && res.data) {
          setIngredients(res.data);
          setPagination({
            currentPage: res.current_page || 1,
            lastPage: res.last_page || 1,
            from: res.from || 0,
            to: res.to || 0,
            total: res.total || 0,
          });
        } else if (Array.isArray(res)) {
          setIngredients(res);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    },
    [perPage],
  );

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchIngredients(1, perPage, search);
    }, 400);
    return () => clearTimeout(delay);
  }, [search, perPage, fetchIngredients]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Do you want to delete this record ? ",
    );
    if (confirmDelete) {
      try {
        setLoading(true);
        await IngredientService.deletes(id);
        fetchIngredients(pagination.currentPage, perPage, search);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      fetchIngredients(newPage, perPage, search);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchIngredients(1, perPage, "");
  };

  return (
    <div className="">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* 1. Header & Filters Section */}
        <div className="bg-white px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200">
          <h1 className="text-gray-800 font-semibold text-xl">
            Ingredients Management
          </h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-end">
            {/* Search Input */}
            <div className="relative flex items-center w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name..."
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
                name="per-page"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
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
              onClick={() => navigate("/ingredients/create")}
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
                    <th className="py-3 px-6 w-16">No</th>
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Qty / Unit</th>
                    <th className="py-3 px-6">Min Stock</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {ingredients.length > 0 ? (
                    ingredients.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/80 transition-colors duration-150"
                      >
                        <td className="py-3 px-6 font-medium text-gray-900">
                          {(pagination.from || 1) + index}
                        </td>
                        <td className="py-3 px-6 font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-6 text-gray-500">
                          {item.qty_stock || "0.00"} {item.unite || "N/A"}
                        </td>
                        <td className="py-3 px-6 text-gray-500">
                          {item.min_stock || "0.00"}
                        </td>
                        <td className="py-3 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              item.status === 1 || item.status === "In Stock"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                : item.status === 0 || item.status === "Low Stock" 
                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                :"bg-red-500/20 text-red-500 border border-rose-300"
                            }`}
                          >
                            {item.status === 1 || item.status === "In Stock"
                              ? "In Stock"
                              : item.status === 0 || item.status === "Low Stock"
                              ? "Low Stock"
                              : "Out of Stock"
                            }
                          </span>
                        </td>
                        <td className="py-3 px-6 text-end space-x-2">
                          <button
                            type="button"
                            title="Edit Ingredient"
                            onClick={() => navigate(`/ingredients/edit/${item.id}`)}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer shadow-sm"
                          >
                            <FiEdit3 className="text-base" />
                          </button>
                          <button
                            type="button"
                            title="Delete Ingredient"
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
                      <td
                        colSpan="6"
                        className="py-12 text-center text-gray-400"
                      >
                        No ingredients found
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
            Showing{" "}
            <span className="font-medium text-gray-900">
              {pagination.from || 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-900">
              {pagination.to || 0}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-900">
              {pagination.total || 0}
            </span>{" "}
            results
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
              disabled={
                pagination.currentPage >= pagination.lastPage || loading
              }
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

export default IngredientsList;
