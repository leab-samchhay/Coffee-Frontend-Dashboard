import CategoryList from './pages/categoryPage/CategoryList'
import { MainLayout } from './layout/MainLayout';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import CategoryForm from './pages/categoryPage/CategoryForm';
import CoffeeTransaction from './pages/coffeeTransaction/CoffeeTransaction';
import IngredientsList from './pages/ingredients/IngredientsList';
import IngredientsForm from './pages/ingredients/IngredientsForm';
import CoffeeIngredientsList from './pages/coffeeIngredients/CoffeeIngredientsList';
import CoffeeIngredientsForm from './pages/coffeeIngredients/CoffeeIngredientsForm';
import CoffeeList from './pages/coffeePage/CoffeeList';
import CoffeeForm from './pages/coffeePage/CoffeeForm';
import CoffeeVariantsList from './pages/coffeeVariants/CoffeeVariantsList';
import CoffeeVariantsForm from './pages/coffeeVariants/CoffeeVariantsForm';
import SupplierList from './pages/supplierPage/SupplierList';
import SupplierForm from './pages/supplierPage/SupplierForm';
import PurchaseTransactionList from './pages/purchaseTransaction/PurchaseTransactionList';
import PurchaseTransaction from './pages/purchaseTransaction/PurchaseTransaction';
import OrderModeList from './pages/orderModePage/OrderModeList';
import OrderModeForm from './pages/orderModePage/OrderModeForm';
import ExchangeList from './pages/exchangePage/ExchangeList';
import ExchangeForm from './pages/exchangePage/ExchangeForm';
import CustomerList from './pages/customerPage/CustomerList';
import CustomerForm from './pages/customerPage/CustomerForm';
import Sale from './pages/posSale/Sale';
import Login from './pages/Auth/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import DiscoundList from './pages/discoundPage/DiscoundList.jsx';
import DiscoundForm from './pages/discoundPage/DiscoundForm.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>} />

        {/* Protected Routes - Checks token before allowing access */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout/>}>
            <Route path='/dashboard' element={<CategoryList />} />

            <Route path='/categories' element={<CategoryList/>} />
            <Route path='/categories/create' element={<CategoryForm/>} />
            <Route path='/categories/edit/:id' element={<CategoryForm/>} />

            <Route path='/coffeeTransaction' element={<CoffeeTransaction/>} />

            <Route path='/ingredients' element={<IngredientsList/>} />
            <Route path='/ingredients/create' element={<IngredientsForm/>} />
            <Route path='/ingredients/edit/:id' element={<IngredientsForm/>} />

            <Route path='/coffeeIngredients' element={<CoffeeIngredientsList/>} />
            <Route path='/coffeeIngredients/create' element={<CoffeeIngredientsForm/>} />
            <Route path='/coffeeIngredients/edit/:id' element={<CoffeeIngredientsForm/>} />
            
            <Route path='/coffee' element={<CoffeeList/>} />
            <Route path='/coffee/create' element={<CoffeeForm/>} />
            <Route path='/coffee/edit/:id' element={<CoffeeForm/>} />

            <Route path='/coffeeVariants' element={<CoffeeVariantsList/>} />
            <Route path='/coffeeVariants/create' element={<CoffeeVariantsForm/>} />
            <Route path='/coffeeVariants/edit/:id' element={<CoffeeVariantsForm/>} />

            <Route path='/suppliers' element={<SupplierList/>} />
            <Route path='/suppliers/create' element={<SupplierForm/>} />
            <Route path='/suppliers/edit/:id' element={<SupplierForm/>} />

            <Route path='/purchaseTransaction' element={<PurchaseTransactionList/>} />
            <Route path='/purchaseTransaction/create' element={<PurchaseTransaction/>} />
            <Route path='/purchaseTransaction/edit/:id' element={<PurchaseTransaction/>} />

            <Route path='/orderModes' element={<OrderModeList/>} />
            <Route path='/orderModes/create' element={<OrderModeForm/>} />
            <Route path='/orderModes/edit/:id' element={<OrderModeForm/>} />

            <Route path='/exchanges' element={<ExchangeList/>} />
            <Route path='/exchanges/create' element={<ExchangeForm/>} />
            <Route path='/exchanges/edit/:id' element={<ExchangeForm/>} />

            <Route path='/discound' element={<DiscoundList/>}/>
            <Route path='/discound/create' element={<DiscoundForm/>} />
            <Route path='/discound/edit/:id' element={<DiscoundForm/>} />

            <Route path='/customers' element={<CustomerList/>} />
            <Route path='/customers/create' element={<CustomerForm/>} />
            <Route path='/customers/edit/:id' element={<CustomerForm/>} />
          </Route>

          <Route path='/sale' element={<Sale/>} />
        </Route>

        {/* Catch-all route for any undefined path -> Redirect to Login */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
