import React from 'react'
import { stepsData } from '../assets/assets'
import {motion} from 'framer-motion'

export default function Steps() {
  return (
    <motion.div
    initial={{opacity:0, y:100}}
    whileInView={{opacity:1, y:0}}
    transition={{duration:1}}
    viewport={{once:true}}
    className='my-20 flex flex-col gap-8'
    >
      <h1 className='text-3xl sm:text-4xl font-semibold mb-2'>How it works</h1>
      <p className='text-lg text-gray-600 mb-6'>Follow these simple steps to generate your images</p>
      <div>
        {stepsData.map((item, index) => (
          <div key={index} className='flex items-center gap-4 p-5 px-8 bg-white/20 shadow-md border cursor-pointer hover:scale-[1.02] transition-all duration-300 rounded-large' >
            <div className='flex justify-center items-center rounded-full bg-blue-100 w-16 h-16 sm:w-20 sm:h-20' >
              <img className='w-8 sm:w-10' src={item.icon} alt="" />
            </div>
            <div className='text-center sm:text-left' >
              <h2 className='text-xl font-semibold mb-1' >{item.title}</h2>
              <p className='text-gray-600 max-w-md' >{item.description}</p>
            </div>
          </div>
        ))} 
      </div>
    </motion.div>
  )
}
