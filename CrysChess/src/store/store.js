import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";

import userReducer from "./userSlice";
import friendReducer from "./friendSlice";
import gameReducer from "./gameSlice"; 
import gameBoardReducer from "./gameBoardSlice";
import onlineReducer from "./onlineSlice";


const persistConfig = {
  key: "root",
  storage,
};

const rootReducer = combineReducers({
  user: userReducer,
  friends: friendReducer,
  game: gameReducer,
  gameBoard: gameBoardReducer,
  online: onlineReducer,

});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // 👈 avoids the non-serializable warning
    }),
});

export const persistor = persistStore(store);
