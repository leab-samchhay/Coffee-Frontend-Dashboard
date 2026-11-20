import api from "./api"


export const OrderTransaction = {
    
    createOrderTransaction : async(data) => {
        try{
            const res = await api.post("/transaction-order",data);
            return res.data.data || null;
        }
        catch(err){
            throw err
        }
    }

}
