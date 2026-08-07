export const INTERESTS = [
  'Adventure Sports','Cultural Exploration',
  'Food & Local Cuisine','Nature & Relaxation',
  'Nightlife','Photography','Relaxation',
  'Shopping','Trekking','Water Sports',
]
export const PURPOSES      = ['Adventure','Business','Family Vacation','Honeymoon','Leisure']
export const AGE_RANGES    = ['18-25','26-35','36-45','46-60']
export const HEALTH_ISSUES = ['None','Asthma','High Blood Pressure','Knee Pain']
export const CUISINE_TYPES = [
  'Bengali Cuisine','Coorgi Cuisine','Gujarati Cuisine',
  'Himachali Cuisine','Hyderabadi Cuisine','Kerala Cuisine',
  'Maharashtrian Cuisine','Mughlai Cuisine','Multi Cuisine',
  'North East Cuisine','North Indian Cuisine','Odia Cuisine',
  'Punjabi Cuisine','Rajasthani Cuisine','Seafood',
  'South Indian Cuisine','Street Food','Tibetan Cuisine',
]
export const INTEREST_ICONS = {
  'Adventure Sports':'🏄','Cultural Exploration':'🏛️',
  'Food & Local Cuisine':'🍛','Nature & Relaxation':'🌿',
  'Nightlife':'🌙','Photography':'📸','Relaxation':'🧘',
  'Shopping':'🛍️','Trekking':'🥾','Water Sports':'🤿',
}
export const PURPOSE_ICONS = {
  'Adventure':'🧗','Business':'💼','Family Vacation':'👨‍👩‍👧‍👦',
  'Honeymoon':'💑','Leisure':'🌴',
}
export const HEALTH_ICONS = {
  'None':'✅','Asthma':'🫁','High Blood Pressure':'❤️','Knee Pain':'🦵',
}
export const TYPE_ICONS = {
  'Beach':'🏖️','Adventure':'🏔️','Nature':'🌿',
  'Historical':'🏛️','City':'🏙️',
}
export const BUDGET_CATEGORIES = ['Hotel','Food','Transport','Activities','Shopping','Other']
export const CATEGORY_COLORS = {
  Hotel:'#3B82F6',Food:'#10B981',Transport:'#F59E0B',
  Activities:'#8B5CF6',Shopping:'#EC4899',Other:'#6B7280',
}

export const DESTINATION_DETAILS = {
  "Ahmedabad":         { state:"Gujarat",           type:"City",       best_time:"Oct-Mar", cuisine:"Gujarati Cuisine",      image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjjS0tleUkYu3JCgQn5BM0ooo_ueYok5FwDld1RJJHOQ&s=10" },
  "Ajanta Caves":      { state:"Maharashtra",       type:"Historical", best_time:"Nov-Feb", cuisine:"Maharashtrian Cuisine", image_url:"https://plus.unsplash.com/premium_photo-1697729588019-20a1f5a325d1" },
  "Auli":              { state:"Uttarakhand",       type:"Adventure",  best_time:"Apr-Jun", cuisine:"North Indian Cuisine",  image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF-TkMBCYdtCTzI4rau2709Tbi2zVPKRaXu7qTOHjiZS7J37ZNbGLQxYMv&s=10" },
  "Baga Beach":        { state:"Goa",               type:"Beach",      best_time:"Nov-Mar", cuisine:"Seafood",               image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeseYB8OMIYAnzRmlYP6matYpojVkK9lRx0Wgn7x8BYcxvxjfwm4QrUxM&s=10" },
  "Bangalore":         { state:"Karnataka",         type:"City",       best_time:"Oct-Mar", cuisine:"Multi Cuisine",         image_url:"https://media.istockphoto.com/id/1382384282/photo/bangalore-or-bengaluru.jpg" },
  "Bir Billing":       { state:"Himachal Pradesh",  type:"Adventure",  best_time:"Apr-Jun", cuisine:"Himachali Cuisine",     image_url:"https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/0a/c6/99/67.jpg" },
  "Calangute Beach":   { state:"Goa",               type:"Beach",      best_time:"Nov-Mar", cuisine:"Seafood",               image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQawETYRiYBsH6-h7nyRef7D05VLNnIS00HBpFyaZdOJDehCXzhEkUfAY5Vf_tWlUzd5qaIpJnkr2vAOF1xcvRS_dDd2Lq-Y2B30QDq-g&s=10" },
  "Chandigarh":        { state:"Punjab",            type:"City",       best_time:"Oct-Mar", cuisine:"Punjabi Cuisine",       image_url:"https://s7ap1.scene7.com/is/image/incredibleindia/chandigarh-union-territory-1-city-ff" },
  "Coorg":             { state:"Karnataka",         type:"Nature",     best_time:"Sep-Mar", cuisine:"Coorgi Cuisine",        image_url:"https://images.unsplash.com/photo-1710612198146-77512950a4b7" },
  "Delhi":             { state:"Delhi",             type:"City",       best_time:"Oct-Mar", cuisine:"Street Food",           image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFxblF-zkMM4NsiVuRyJ1Yx76TMcpdDWzU6zEf57y1aQ&s=10" },
  "Ellora Caves":      { state:"Maharashtra",       type:"Historical", best_time:"Nov-Feb", cuisine:"Maharashtrian Cuisine", image_url:"https://indiaholidaymall.com/images/blog/Ellora-Caves-Unesco-World-Heritage-Site.jpg" },
  "Fatehpur Sikri":    { state:"Uttar Pradesh",     type:"Historical", best_time:"Nov-Feb", cuisine:"Mughlai Cuisine",       image_url:"https://images.unsplash.com/photo-1717761558642-32cbeccbee7e" },
  "Gokarna Beach":     { state:"Karnataka",         type:"Beach",      best_time:"Nov-Mar", cuisine:"Seafood",               image_url:"https://realtalktravel.com/wp-content/uploads/Om-Beach-Gokarna.webp" },
  "Hampi Ruins":       { state:"Karnataka",         type:"Historical", best_time:"Nov-Feb", cuisine:"South Indian Cuisine",  image_url:"https://wegobond.com/wp-content/uploads/2018/01/hampi-banner.jpg" },
  "Hyderabad":         { state:"Telangana",         type:"City",       best_time:"Oct-Mar", cuisine:"Hyderabadi Cuisine",    image_url:"https://t4.ftcdn.net/jpg/03/60/89/09/360_F_360890991_Ykybj5JO5HYBaqWeROz9cR2jWXN8HZxf.jpg" },
  "Jaipur":            { state:"Rajasthan",         type:"City",       best_time:"Oct-Mar", cuisine:"Rajasthani Cuisine",    image_url:"https://t4.ftcdn.net/jpg/05/84/76/73/360_F_584767353_EXYOkE8NcX37UwV4WfBw7AjBaEtU6mMy.jpg" },
  "Kerala Backwaters": { state:"Kerala",            type:"Nature",     best_time:"Sep-Mar", cuisine:"Kerala Cuisine",        image_url:"https://www.backpackadventures.org/wp-content/uploads/2020/08/india0898.jpg" },
  "Khajuraho Temples": { state:"Madhya Pradesh",    type:"Historical", best_time:"Nov-Feb", cuisine:"North Indian Cuisine",  image_url:"https://st2.depositphotos.com/1000434/7761/i/450/depositphotos_77615282-stock-photo-lakshmana-temple-in-khajuraho-madhya.jpg" },
  "Kodaikanal":        { state:"Tamil Nadu",        type:"Nature",     best_time:"Sep-Mar", cuisine:"South Indian Cuisine",  image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRR1MrvitA-PthZ_UMPeUYOYvzHFu6Olty-pnoL9EqaCl31ZwvMHSvu9OQ&s=10" },
  "Kolkata":           { state:"West Bengal",       type:"City",       best_time:"Oct-Mar", cuisine:"Bengali Cuisine",       image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7RyEWQTvFgkgjKGGCyk4MsFgdUZhpvExLEydL8FmtvfqAtgLceIK1K2mg&s=10" },
  "Konark Sun Temple": { state:"Odisha",            type:"Historical", best_time:"Nov-Feb", cuisine:"Odia Cuisine",          image_url:"https://cdn.britannica.com/19/251919-050-D3E64798/konark-sun-temple-orissa-india-unesco-heritage-site.jpg" },
  "Kovalam Beach":     { state:"Kerala",            type:"Beach",      best_time:"Nov-Mar", cuisine:"Seafood",               image_url:"https://eastindiantraveller.com/wp-content/uploads/2021/01/kovalambeach.jpg" },
  "Leh Ladakh":        { state:"Ladakh",            type:"Adventure",  best_time:"Apr-Jun", cuisine:"Tibetan Cuisine",       image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6syC-08_34gV3HDUrcoT836XfFU1TJFrrucb9MfdLPiXz7ULyfUkGJEq2&s=10" },
  "Manali":            { state:"Himachal Pradesh",  type:"Adventure",  best_time:"Apr-Jun", cuisine:"Himachali Cuisine",     image_url:"https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0c/b2/79/37/solang-valley-manali.jpg" },
  "Marina Beach":      { state:"Tamil Nadu",        type:"Beach",      best_time:"Nov-Mar", cuisine:"Seafood",               image_url:"https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcQct7UyX_Oev4c9kXNkRrH7cu6JRlW5Xs6MNpuB-CTQjXyNxWdF7V64hL9ANP93g9qVVT1kg12v0L1opGDTWLdmYNf-&s=19" },
  "Mumbai":            { state:"Maharashtra",       type:"City",       best_time:"Oct-Mar", cuisine:"Street Food",           image_url:"https://t4.ftcdn.net/jpg/01/46/43/87/360_F_146438747_3XYwVkfnYZuukBZYmDM8xeoqENzyhAqa.jpg" },
  "Munnar":            { state:"Kerala",            type:"Nature",     best_time:"Sep-Mar", cuisine:"Kerala Cuisine",        image_url:"https://images.unsplash.com/photo-1491497895121-1334fc14d8c9" },
  "Ooty":              { state:"Tamil Nadu",        type:"Nature",     best_time:"Apr-Jun", cuisine:"South Indian Cuisine",  image_url:"https://t3.ftcdn.net/jpg/05/09/58/00/360_F_509580096_YjyHXMHyTm9OOkjUQS4kOxDXkxbOMWYi.jpg" },
  "Radhanagar Beach":  { state:"Andaman",           type:"Beach",      best_time:"Nov-Mar", cuisine:"Seafood",               image_url:"https://dynamic-media-cdn.tripadvisor.com/media/photo-o/05/76/7a/1d/radhanagar-beach.jpg" },
  "Red Fort":          { state:"Delhi",             type:"Historical", best_time:"Nov-Feb", cuisine:"Mughlai Cuisine",       image_url:"https://upload.wikimedia.org/wikipedia/commons/d/d6/Delhi%2C_India%2C_Red_Fort_Facade.jpg" },
  "Rishikesh":         { state:"Uttarakhand",       type:"Adventure",  best_time:"Apr-Jun", cuisine:"North Indian Cuisine",  image_url:"https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/31/c5/45/caption.jpg" },
  "Sandakphu":         { state:"West Bengal",       type:"Adventure",  best_time:"Apr-Jun", cuisine:"North East Cuisine",    image_url:"https://aquaterra.in/wp-content/uploads/2020/01/Sandakphu-Trek-03.jpg" },
  "Spiti Trek":        { state:"Himachal Pradesh",  type:"Adventure",  best_time:"Apr-Jun", cuisine:"Himachali Cuisine",     image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVhMTWqQOcmNTuyOBBWk2yd5Mz2ESU1_YGVNdtOk9y5DMIs2TGizrpcCBE&s=10" },
  "Spiti Valley":      { state:"Himachal Pradesh",  type:"Nature",     best_time:"Sep-Mar", cuisine:"Himachali Cuisine",     image_url:"https://storage.googleapis.com/stateless-www-justwravel-com/2021/05/1550217293_shutterstock_1129297934.jpg.jpg" },
  "Taj Mahal":         { state:"Uttar Pradesh",     type:"Historical", best_time:"Nov-Feb", cuisine:"Mughlai Cuisine",       image_url:"https://upload.wikimedia.org/wikipedia/commons/1/1d/Taj_Mahal_%28Edited%29.jpeg" },
  "Tarkarli Beach":    { state:"Maharashtra",       type:"Beach",      best_time:"Nov-Mar", cuisine:"Seafood",               image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmtn0Vsfvni1NmF01OGM9ahIFZcrRqMoNKSjV1xzIEbR5CCG-tr4PumVg&s=10" },
  "Tawang":            { state:"Arunachal Pradesh", type:"Nature",     best_time:"Sep-Mar", cuisine:"North East Cuisine",    image_url:"https://s7ap1.scene7.com/is/image/incredibleindia/sela-pass-tawang-arunachal-pradesh-blog-ntr-hero" },
  "Valley of Flowers": { state:"Uttarakhand",       type:"Nature",     best_time:"Sep-Mar", cuisine:"North Indian Cuisine",  image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKohlQ-J1CgxwCnc1mL62LM__eo7IDPvD9Hm4v1DnS8PQfNYx8O_lBtpoE&s=10" },
  "Varkala Beach":     { state:"Kerala",            type:"Beach",      best_time:"Nov-Mar", cuisine:"Seafood",               image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhhfqvS3M6-Q5xL-XOgqAbXut9hnDO4dA-_VCx1YCE79I6gDY3_C1Zv3dOXwu2pL_OmQVlumXjSSQ8I6p748JioJniT2Wxf2InPIObpQ&s=10" },
  "Zanskar Valley":    { state:"Ladakh",            type:"Adventure",  best_time:"Apr-Jun", cuisine:"Tibetan Cuisine",       image_url:"https://www.swantour.com/blogs/wp-content/uploads/2019/05/Zanskar-Valley-tourism.jpg" },
}