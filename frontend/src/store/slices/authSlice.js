import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AuthService from '../../services/authService';
import { clearStoredAuth, getStoredToken, getStoredUser, persistAuthSnapshot } from '../../utils/authStorage';

const getErrorMessage = (error, fallback) => {
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  return fallback;
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, expectedRole }, { rejectWithValue }) => {
    try {
      const payload = await AuthService.login(email, password);
      const user = payload.user ?? null;

      if (expectedRole && user?.role_id !== expectedRole) {
        return rejectWithValue('Le role selectionne ne correspond pas a ce compte.');
      }

      return {
        user,
        token: payload.token ?? '',
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Connexion impossible.'));
    }
  },
);

export const checkAuth = createAsyncThunk('auth/check', async (_, { rejectWithValue }) => {
  try {
    const payload = await AuthService.check();
    return {
      user: payload.user ?? null,
      token: payload.token ?? '',
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Session invalide.'));
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await AuthService.logout();
    return true;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Deconnexion impossible.'));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getStoredUser(),
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    updateCurrentUser(state, action) {
      state.user = action.payload || null;
      persistAuthSnapshot({ user: state.user, token: getStoredToken() });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.initialized = true;
        persistAuthSnapshot(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Connexion impossible.';
        state.initialized = true;
        clearStoredAuth();
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload.user;
        state.initialized = true;
        persistAuthSnapshot(action.payload);
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.initialized = true;
        clearStoredAuth();
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.error = null;
        state.initialized = true;
        clearStoredAuth();
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.error = null;
        state.initialized = true;
        clearStoredAuth();
      });
  },
});

export const { clearError, updateCurrentUser } = authSlice.actions;
export default authSlice.reducer;
