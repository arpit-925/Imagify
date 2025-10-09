import React from 'react'
import { assets } from '../assets/assets'

export default function Footer() {
  return (
    <div className='flex items-center justify-between gap-4 py-3 mt-20'>
      <img src ={assets.logo} alt='logo'  width={150}className='w-24'/>
      <p className='flex-1 border-l border-gray-300 pl-4 text-sm  text-gray-500 max-sm:hidden'>Copyright @Arpit.dev | All right reserved.</p>
      <div className='flex gap-2.5'>
        <a href='https://www.facebook.com/share/1Nz6xhESHQ/' target='_blank' rel='noreferrer'>
        <img src={assets.facebook_icon} alt='' className='w-6 inline-block mx-2 cursor-pointer'/>
        </a>
        <a href='https://x.com/ArpitMi64908731?t=_SqU2nhd2w6GujKvsdYPCg&s=09' target='_blank' rel='noreferrer'>
        <img src={assets.twitter_icon} alt='twitter' className='w-6 inline-block mx-2 cursor-pointer'/>
        </a>
        <a href='https://www.instagram.com/i_m_arpitmishra925?igsh=MWI1cDdqN3Vyc3ExNA==' target='_blank' rel='noreferrer'>
        <img src={assets.instagram_icon} alt='linkedin' className='w-6 inline-block mx-2 cursor-pointer'/>
        </a>
        
      </div>
    </div>
  )
}
