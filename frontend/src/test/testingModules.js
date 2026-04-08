import * as reduxToolkit from '@reduxjs/toolkit';
import * as testingLibraryReact from '@testing-library/react';
import * as reactRedux from 'react-redux';
import * as reactRouterDom from 'react-router-dom';

export const { configureStore } = reduxToolkit;
export const { act, renderHook, screen, waitFor } = testingLibraryReact;
export const { Provider } = reactRedux;
export const { Route, Routes } = reactRouterDom;
