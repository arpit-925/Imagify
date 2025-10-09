import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

export default function Login() {
  const { setShowLogin, backendUrl, setToken, setUser } = useContext(AppContext);
  const [state, setState] = useState('Login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (state === 'Login') {
        ({ data } = await axios.post(`${backendUrl}/api/users/login`, { email, password }));
      } else {
        ({ data } = await axios.post(`${backendUrl}/api/users/register`, { name, email, password }));
      }

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        setShowLogin(false);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error("Login/Register Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Server error");
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className='fixed top-0 left-0 w-full h-full backdrop-blur-sm bg-black/30 flex justify-center items-center z-[9999]'>
      <motion.form
        onSubmit={onSubmitHandler}
        initial={{ opacity: 0.2, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='relative bg-white w-full max-w-md p-6 rounded-xl'>
        
        <h1 className='text-center text-2xl text-neutral-700 font-medium'>{state}</h1>
        <p className='text-sm'>Welcome back ! Please sign in to continue</p>

        {state !== 'Login' && (
          <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-5'>
            <img src={assets.user_icon} alt='' />
            <input onChange={e => setName(e.target.value)} value={name} type='text' placeholder='Full Name' required className='outline-none text-sm' autoComplete="name" />
          </div>
        )}

        <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-4'>
          <img src={assets.email_icon} alt='' />
          <input onChange={e => setEmail(e.target.value)} value={email} type='email' placeholder='Enter Email' required className='outline-none text-sm' autoComplete="email" />
        </div>

        <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-4'>
          <img src={assets.lock_icon} alt='' />
          <input onChange={e => setPassword(e.target.value)} value={password} type='password' placeholder='Enter Password' required className='outline-none text-sm' autoComplete={state === 'Login' ? "current-password" : "new-password"} />
        </div>

        <p className='text-sm text-blue-500 my-3 cursor-pointer'>Forgot Password?</p>

        <button className='bg-blue-600 w-full text-white py-2 rounded-full hover:bg-blue-700 transition'>
          {state === 'Login' ? 'Login' : 'Create Account'}
        </button>

        {state === 'Login' ?
          <p className='mt-5 text-center'>
            Don't have an account? <span className='text-blue-600 cursor-pointer' onClick={() => setState('Sign Up')}>Sign Up</span>
          </p>
          :
          <p className='mt-5 text-center'>
            Already have an account? <span className='text-blue-600 cursor-pointer' onClick={() => setState('Login')}>Login</span>
          </p>
        }

        <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt='' className='w-6 absolute top-4 right-4 cursor-pointer' />
      </motion.form>
    </div>
  );
}
