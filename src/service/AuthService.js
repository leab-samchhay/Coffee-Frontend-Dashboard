import api from "./api";

export async function login(email, password) {
    const response = await api.post('login', { email, password });
    const data = response.data?.data?.data ?? response.data?.data ?? response.data;

    if (typeof data?.token !== 'string' || !data?.token) {
        throw new Error(data?.message || 'The login response must contain a token');
    }

    const user = await getCurrentUser(data.token);
    return { token: data.token, user };
}

export async function getCurrentUser(token) {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const respon = await api.get('get-user', config);
    const user = respon.data?.data ?? respon.data;

    if (!user?.id) {
        throw new Error('The get-user response must contain a user with an id');
    }
    return user;
}

export async function logout() {
    await api.post('logout');
}
