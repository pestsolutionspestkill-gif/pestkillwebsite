import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Bug, Zap, Shield, BedDouble, CloudRain, Leaf, HelpCircle, Building2, Sparkles } from 'lucide-react';
import './Blog.css';

const categoryColors = {
  'Termite Control': '#1a7a4a',
  'Cockroach Control': '#7a1a1a',
  'Rodent Control': '#4a3a1a',
  'Bed Bugs': '#1a3a7a',
  'Seasonal': '#2a5a7a',
  'Prevention': '#3a6a2a',
  'Commercial': '#4a3a6a',
  'FAQ': '#6a4a2a',
  'Guide': '#1a4a6a',
};

const categoryIcons = {
  'Termite Control': <Bug size={32} />,
  'Cockroach Control': <Zap size={32} />,
  'Rodent Control': <Shield size={32} />,
  'Bed Bugs': <BedDouble size={32} />,
  'Seasonal': <CloudRain size={32} />,
  'Prevention': <Leaf size={32} />,
  'Commercial': <Building2 size={32} />,
  'FAQ': <HelpCircle size={32} />,
  'Guide': <Sparkles size={32} />,
};

const blogPosts = [
  { 
    _id: '0', 
    slug: 'anti-termite-piping-treatment', 
    title: 'Anti-Termite Piping Treatment using Porous Pipes (Pre-Construction)', 
    excerpt: 'Learn about the most effective pre-construction termite treatment method that provides 10-15 years of protection.',
    content: `Anti-Termite Piping Treatment using Porous Pipes (Pre-Construction)

Introduction

Termites ek aisi problem hai jo aapke ghar ki deewaron ke ander quietly kaam karti hai. Jab aapko pata chalta hai ki termites aapke ghar mein enter ho gaye hain, tab bohot damage ho chuka hota hai. Isliye expert log kehta hai ki pre-construction termite treatment sabse best option hai.

Jab aap naya ghar bana rahe hain, tab anti-termite piping treatment ek brilliant investment hai jo aapke ghar ko lifetime ke liye termites se bacha sakta hai. Porous pipe system ek aisa technique hai jo soil mein chemical uniformly distribute karta hai aur long-term protection deta hai.

What is Porous Pipe System?

Porous pipe system ek special piping network hai jo foundation ke niche install kiya jata hai. Yeh pipes specially designed hote hain jinke through termiticide (anti-termite chemical) soil mein slowly release hota hai.

Concept samjhein:
- Pipes ki wall mein micro-holes hoti hain
- Chemical in holes se nikal kar soil mein soak karti hai
- Yeh ek permanent chemical barrier banati hai
- Termites jab bhi is zone mein enter karne ki koshish karein, unhe chemical se contact hota hai aur vo wapis chal di jate hain

Step-by-Step Procedure

Step 1: Soil Preparation
Sabse pehle builder ya contractor foundation ki soil ko properly compact karta hai. Soil properly set hone dein kyunki uneven soil mein chemical properly spread nahi hogi.
- Foundation area ko clear karein
- Big rocks aur debris hata dein
- Soil ko properly level karein

Step 2: Pipe Layout Planning
Ab architect ya pest control expert ke hisaab se pipe layout plan kiya jata hai:
- Foundation ke borders par pipes install hote hain
- Internal walls ke niche bhi pipes hoti hain
- Har room ke boundary par minimum 1 pipe line

Step 3: Porous Pipes Installation
Ab porous pipes ko foundation ke niche install kiya jata hai:
- Pipes ko 6-8 inches ki depth par rakhna hai
- Ensure karein pipes properly connected hain

Step 4: Post-Construction Refill System
Ek bahut important part hai refill system:
- Building ke outside ek access point rakhna hai
- Isse future mein chemical refill kar payenge
- Floor breaking ki zaroorat nahi hogi

Step 5: Chemical Treatment
Ab last step mein professional termiticide inject kiya jata hai:
- Fipronil ya Imidacloprid based chemical use karein
- Professional grade products hi use karein

Advantages of Porous Pipe System

1. Long-Term Protection: Ek baar install karne ke baad, porous pipe system 10-15 saal tak protection deta hai.
2. Re-treatment Possible Without Breaking Floor: Future mein chemical refill karne ke liye floor todne ki zaroorat nahi.
3. Uniform Chemical Distribution: Traditional drilling method se behtarin result.
4. No Structural Damage: Pre-construction treatment mein koi drilling nahi.

Why Porous Pipe is Best for Pre-Construction

- Cost-effective: Initially thoda investment zyada lag sakta hai, but long-term mein paise bachte hain.
- No structural damage: Building banne ke baad koi hacking nahi.
- Permanent solution: Lifetime protection.

Comparison: Porous Pipe vs Traditional Treatment

| Feature | Porous Pipe System | Traditional Drilling |
|---------|------------------|-------------------|
| Cost | ₹22-25/sq.ft. (ek baar) | ₹6-9/sq.ft. (har treatment) |
| Longevity | 10-15 years | 5-7 years |
| Re-treatment | Easy | Difficult |

Safety and Chemical Information

- Professional handling zaroori hai
- Certified technicians ko hi kaam karwana chahiye
- ENVU Agenda, Heranba Heranil Plus products use hote hain

Frequently Asked Questions

Q1: Is porous pipe treatment necessary for every new home?
Ans: Ji haan, highly recommended hai.

Q2: How much does it cost in Rajasthan?
Ans: Porous pipe system ₹22-25 per sq.ft. hota hai. Normal pre-construction soil treatment ₹12-15 per sq.ft. hai.

Q3: Can we install after construction?
Ans: Possible hai but costly aur difficult hai.

Q4: How long does the treatment last?
Ans: 10-15 saal tak valid hai warranty ke saath.

Get Professional Pre-Construction Termite Treatment

Naya ghar bana rahe hain? Abhi hi free consultation book karein!`,
    image: '🔧', 
    category: 'Termite Control', 
    date: '2026-04-20', 
    readTime: '8 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '1', 
    slug: 'termite-prevention-tips', 
    title: '10 Effective Termite Prevention Tips for Your Home', 
    excerpt: 'Learn how to protect your home from termite infestations with these proven prevention methods.',
    content: `Termites are one of the most destructive pests that can invade your home. These silent destroyers can cause extensive damage to your property before you even notice their presence. Here are 10 effective tips to prevent termite infestations:

1. **Reduce Moisture**: Termites love moisture. Fix any leaky pipes, faucets, or roofing that may be causing water accumulation around your home.

2. ** proper Ventilation**: Ensure proper ventilation in crawl spaces and attics to reduce humidity.

3. **Store Firewood Properly**: Keep firewood at least 20 feet away from your home and elevated off the ground.

4. **Remove Dead Trees and Stumps**: Remove any dead trees, stumps, or debris near your home as these can attract termites.

5. **Use Termite-Resistant Materials**: Consider using termite-resistant wood or pressure-treated lumber for any construction.

6. **Regular Inspections**: Schedule annual professional termite inspections to catch any early signs.

7. **Maintain Your Foundation**: Keep the foundation dry by ensuring proper drainage away from your home.

8. **Seal Entry Points**: Seal any cracks or openings in your foundation where termites could enter.

9. **MonitorLandscaping**: Keep plants and mulch at least 6 inches away from your foundation.

10. **Professional Treatment**: Consider preventive soil treatment before construction if you're building a new home.`,
    image: '🐛', 
    category: 'Termite Control', 
    date: '2026-01-15', 
    readTime: '5 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '2', 
    slug: 'why-cockroaches-in-home', 
    title: 'Why Do Cockroaches Invade Your Home?', 
    excerpt: 'Understanding the causes of cockroach infestations and how to prevent them.',
    content: `Cockroaches are one of the most common household pests that can make your home their own. Understanding why they invade can help you prevent infestations.

**Common Reasons for Cockroach Infestations:**

1. **Food Sources**: Cockroaches are attracted to food residues, grease, and crumbs. Kitchens are their favorite haunts.

2. **Water**: Like all living things, cockroaches need water. Leaky faucets and damp areas attract them.

3. **Warmth**: Cockroaches prefer warm environments, making your home ideal, especially in winter.

4. **Entry Points**: They can enter through cracks in walls, gaps under doors, and around windows.

5. **Clutter**: Cluttered homes provide perfect hiding spots for cockroaches.

**Prevention Tips:**
- Keep your kitchen clean
- Store food in airtight containers
- Fix water leaks immediately
- Seal entry points
- Reduce clutter
- Regular pest control treatments

**Health Risks:**
Cockroaches can spread diseases like Salmonella, E. coli, and cause allergies. It's important to address infestations quickly.`,
    image: '🐜', 
    category: 'Cockroach Control', 
    date: '2026-01-12', 
    readTime: '4 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '3', 
    slug: 'rodent-dangers-health', 
    title: 'Health Dangers of Rodent Infestations', 
    excerpt: 'Rats and mice can spread serious diseases. Learn about the health risks.',
    content: `Rodents like rats and mice are more than just a nuisance - they pose serious health risks to you and your family.

**Diseases Spread by Rodents:**

1. **Hantavirus**: Can cause severe respiratory illness
2. **Salmonella**: Food poisoning through contaminated food
3. **Leptospirosis**: Bacterial infection through urine
4. **Plague**: Though rare, still a concern
5. **Rat-bite Fever**: Through bites or scratches

**Health Hazards:**
- Rodent droppings can cause allergic reactions
- Their urine can contaminate food sources
- They can bring fleas and ticks into your home
- Bites can cause infections

**Signs of Rodent Infestation:**
- Droppings in cabinets or drawers
- Gnaw marks on wires, wood, or food packaging
- Scratching sounds in walls
- Unusual pet behavior
- Musky odor

**Prevention:**
- Seal all entry points
- Keep food stored properly
- Remove clutter
- Professional pest control`,
    image: '🐀', 
    category: 'Rodent Control', 
    date: '2026-01-10', 
    readTime: '6 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '4', 
    slug: 'bed-bugs-signs', 
    title: 'How to Identify Bed Bug Infestations Early', 
    excerpt: 'Spot the warning signs of bed bugs before they spread.',
    content: `Bed bugs are excellent at hiding and can quickly infest your entire home. Learning to identify early signs is crucial.

**Early Signs of Bed Bugs:**

1. **Bite Marks**: Red, itchy bites, often in a line or cluster
2. **Blood Stains**: Small blood stains on sheets
3. **Dark Spots**: Bed bug droppings on mattresses
4. **Eggs**: Tiny white eggs in seams
5. **Shed Skins**: Empty molted skins
6. **Sweet Odor**: Musty, sweet smell

**Where to Check:**
- Mattress seams and edges
- Box springs
- Bed frames
- Headboards
- Behind wallpaper
- Electrical outlets
- Furniture cracks

**What to Do If You Find Bed Bugs:**
- Don't panic
- Don't try home remedies alone
- Call professional pest control
- Wash all bedding in hot water
- Vacuum thoroughly
- Seal mattress if needed

**Prevention When Traveling:**
- Inspect hotel rooms
- Keep luggage raised
- Check luggage before leaving
- Wash clothes immediately upon return`,
    image: '🛏️', 
    category: 'Bed Bugs', 
    date: '2026-01-08', 
    readTime: '4 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '5', 
    slug: 'monsoon-pest-control', 
    title: 'Monsoon Pest Control: Essential Guide', 
    excerpt: 'Rainy season brings increased pest activity. Protect your home now.',
    content: `The monsoon season brings increased pest activity as insects and rodents seek shelter and food indoors. Here's how to protect your home:

**Common Monsoon Pests:**
- Cockroaches
- Ants
- Rats and mice
- Mosquitoes
- Termites

**Why Pests Increase in Monsoon:**
1. Search for dry shelter
2. Food sources become contaminated
3. Breeding grounds flood
4. Humidity attracts insects

**Preventive Measures:**

1. **Seal Entry Points**: Check and seal all cracks, gaps, and openings around windows and doors.

2. **Fix Moisture Issues**: Repair leaking roofs and pipes immediately.

3. **Proper Waste Management**: Keep garbage in sealed bins and dispose regularly.

4. **Garden Maintenance**: Trim bushes and remove standing water.

5. **Professional Treatment**: Schedule pre-monsoon pest control.

**DIY Tips:**
- Use mesh on windows
- Keep lights off at entry points
- Use cockroach gels in kitchen
- Store food properly
- Use mosquito nets

**Professional Services:**
- Full home inspection
- Interior and exterior treatment
- Termite barriers
- Regular maintenance plans`,
    image: '🌧️', 
    category: 'Seasonal', 
    date: '2026-01-05', 
    readTime: '5 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '6', 
    slug: 'kitchen-pest-prevention', 
    title: 'Kitchen Pest Prevention Guide', 
    excerpt: 'Keep your kitchen pest-free with these simple tips.',
    content: `The kitchen is the heart of your home - and also a prime target for pests. Here's how to keep it pest-free:

**Common Kitchen Pests:**
- Cockroaches
- Ants
- Pantry moths
- Flies
- Rodents

**Prevention Essentials:**

1. **Cleanliness**
   - Wipe counters daily
   - Clean spills immediately
   - Don't leave dirty dishes overnight
   - Sweep and mop regularly

2. **Food Storage**
   - Store food in airtight containers
   - Check expiry dates regularly
   - Keep dry goods sealed
   - Don't overstock pantry

3. **Proper Disposal**
   - Use sealed garbage bins
   - Empty trash daily
   - Compost away from house
   - Clean recycling bins

4. **Regular Maintenance**
   - Check for leaks
   - Seal cracks and gaps
   - Clean under appliances
   - Inspect groceries before storing

**Natural Deterrents:**
- Bay leaves in pantry
- Vinegar traps for flies
- Cucumber slices for ants
- Mint for cockroaches

**When to Call Professionals:**
- If you see droppings
- If pests return after cleaning
- If there's damage to packaging
- For regular prevention`,
    image: '🍳', 
    category: 'Prevention', 
    date: '2026-01-03', 
    readTime: '4 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '7', 
    slug: 'office-pest-control', 
    title: 'Office Pest Control: A Complete Guide', 
    excerpt: 'Maintain a pest-free workplace with these professional tips.',
    content: `A pest-free office environment is crucial for employee health and professional image. Here's the complete guide:

**Why Office Pest Control Matters:**
- Employee health and safety
- Professional reputation
- Equipment protection
- Compliance requirements

**Common Office Pests:**
- Cockroaches
- Ants
- Rodents
- Flies
- Occasional spiders

**High-Risk Areas:**
- Break rooms/kitchens
- Storage rooms
- Basements
- Near vending machines
- Documents storage

**Prevention Protocol:**
1. **Food Storage**: Employee training on proper storage
2. **Waste Management**: Regular cleaning schedules
3. **Seal Entry Points**: Professional inspection
4. **Regular Professional Treatment**: Scheduled visits

**What to Look For:**
- Droppings in drawers
- Gnaw marks on wires
- Strange odors
- Pest sightings

**Professional Services for Offices:**
- Full inspection
- Customized treatment plan
- Scheduled maintenance
- Documentation for compliance
- Emergency response

**Choosing a Pest Control Service:**
- Look for commercial experience
- Check certifications
- Ask about eco-friendly options
- Get regular reporting`,
    image: '🏢', 
    category: 'Commercial', 
    date: '2025-12-28', 
    readTime: '5 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '8', 
    slug: 'pest-control-warehouse', 
    title: 'Warehouse Pest Management Guide', 
    excerpt: 'Industrial pest control solutions for warehouses and factories.',
    content: `Warehouses and factories face unique pest control challenges. Here's your complete guide:

**Challenges in Warehouses:**
- Large spaces to treat
- Multiple entry points
- Stored products attract pests
- Forklift and traffic areas
- Climatic control issues

**Common Warehouse Pests:**
- Rodents (rats, mice)
- Cockroaches
- Stored product pests
- Birds
- Insects in stored goods

**Integrated Pest Management (IPM):**

1. **Prevention**
   - Seal building envelope
   - Install door sweeps
   - Use mesh on vents
   - Proper storage practices

2. **Monitoring**
   - Regular inspections
   - Pest monitoring devices
   - Staff training to report sightings
   - Documentation

3. **Control**
   - Targeted treatments
   - Rodent stations
   - Insect monitoring
   - Professional applications

4. **Documentation**
   - Keep treatment records
   - Track pest sightings
   - Maintain compliance files

**Industry Standards:**
- FIFO (First In, First Out)
- Regular product rotation
- Stack cleanliness
- Proper pallets
- Climate control

**Professional Services:**
- Customized IPM plans
- Night treatments available
- Large area expertise
- Regulatory compliance`,
    image: '🏭', 
    category: 'Commercial', 
    date: '2025-12-25', 
    readTime: '6 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '9', 
    slug: 'home-hygiene-tips', 
    title: 'Home Hygiene Tips to Prevent Pests', 
    excerpt: 'Essential cleaning habits that keep pests away.',
    content: `Good hygiene is your first defense against pests. Here are essential tips:

**Daily Habits:**
- Wash dishes immediately
- Wipe kitchen counters
- Take out trash regularly
- Don't leave pet food out

**Weekly Tasks:**
- Deep clean kitchen
- Vacuum all floors
- Clean under appliances
- Check drains for buildup

**Monthly Chores:**
- Defrost freezer
- Clean behind furniture
- Check window seals
- Inspect basement/attic

**Pest-Prone Areas to Focus:**
- Kitchen (food storage, appliances)
- Bathrooms (moisture, leaks)
- Basement (clutter, dampness)
- Garage (storage, entry points)

**Quick Tips:**
- Sweep daily
- Mop weekly
- Check for leaks monthly
- Deep clean seasonally

**Natural Prevention:**
- Essential oils (peppermint, lavender)
- Vinegar in drains
- Bay leaves in pantry
- Citrus peels (remove regularly)

**When Hygiene Isn't Enough:**
- Structural issues
- Neighbor problems
- Seasonal influx
- Previous infestations`,
    image: '🧹', 
    category: 'Prevention', 
    date: '2025-12-22', 
    readTime: '4 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '10', 
    slug: 'natural-pest-control', 
    title: 'Natural vs Chemical Pest Control', 
    excerpt: 'Compare organic and chemical pest control methods for your home.',
    content: `Choosing between natural and chemical pest control? Here's a comprehensive comparison:

**Natural Pest Control:**

*Pros:*
- Safer for family and pets
- Environmentally friendly
- No strong odors
- Good for maintenance

*Cons:*
- May take longer
- Less effective for severe infestations
- May require more applications
- Can be more expensive

**Methods:**
- Diatomaceous earth
- Neem oil
- Essential oils
- Biological controls
- Physical barriers

**Chemical Pest Control:**

*Pros:*
- Fast-acting
- More effective for severe cases
- Longer-lasting
- Cost-effective

*Cons:*
- Safety precautions needed
- Strong odors
- Environmental impact
- Resistance possible

**When to Use Each:**

*Natural:*
- Preventive treatments
- Minor problems
- Families with pets/children
- Regular maintenance

*Chemical:*
- Severe infestations
- Emergency situations
- Commercial spaces
- Quick results needed

**Integrated Approach:**
Many professionals recommend using both:
1. Natural for prevention
2. Chemical for treatment
3. Natural for maintenance

**Best Practice:**
- Consult professionals
- Follow label directions
- Consider the severity
- Think long-term`,
    image: '🌿', 
    category: 'Prevention', 
    date: '2025-12-20', 
    readTime: '5 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '11', 
    slug: 'pest-control-questions', 
    title: '15 Questions About Pest Control - Answered', 
    excerpt: 'Expert answers to the most commonly asked pest control questions.',
    content: `We've compiled answers to the 15 most common pest control questions:

**1. How do I know if I have pests?**
Look for droppings, damage, sightings, and unusual od

**2. Are pest control chemicals safe?**
Yes, when applied by professionals following safety guidelines.

**3. How long does treatment take?**
Most treatments take a few hours to full effect within days.

**4. Do I need to leave my home during treatment?**
Usually no, but ventilation is recommended.

**5. How often should I get pest control?**
Annual treatment is recommended; more for high-risk areas.

**6. What's the difference between gels and sprays?**
Gels are for cockroaches and ants; sprays for general treatment.

**7. Can I treat pests myself?**
DIY works for minor cases; professionals recommended for major issues.

**8. How much does pest control cost?**
Depends on property size and pest type; get a quote.

**9. Do you guarantee your work?**
Yes, we offer warranties on most treatments.

**10. Are natural treatments effective?**
Yes, for prevention and minor issues.

**11. How do I prevent re-infestation?**
Seal entry points, maintain hygiene, regular treatments.

**12. What pests do you treat?**
All common household and commercial pests.

**13. Do you treat commercial properties?**
Yes, we have specialized commercial services.

**14. Are your treatments eco-friendly?**
We offer both traditional and green options.

**15. How do I schedule service?**
Call us or book online for inspection.`,
    image: '❓', 
    category: 'FAQ', 
    date: '2025-12-18', 
    readTime: '7 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '12', 
    slug: 'restaurant-pest-control', 
    title: 'Restaurant Pest Control: Complete Guide', 
    excerpt: 'Food safety and pest management for restaurants.',
    content: `Pest control in restaurants is critical for food safety and customer health. Here's the complete guide:

**Why It's Crucial:**
- Health department compliance
- Customer safety
- Reputation protection
- Food safety standards

**Common Restaurant Pests:**
- Cockroaches
- Flies
- Rodents
- Ants
- Stored product pests

**High-Risk Areas:**
- Kitchen
- Storage rooms
- Dumpster areas
- Basements
- Service areas

**Prevention Protocol:**
1. **Food Storage**
   - Airtight containers
   - FIFO rotation
   - Proper temperature

2. **Cleaning**
   - Daily deep cleaning
   - Grease trap maintenance
   - Waste management

3. **Maintenance**
   - Seal entry points
   - Fix leaks immediately
   - Regular inspections

**Professional Services:**
- Daily/weekly visits
- Eco-friendly options
- Staff training
- Documentation
- Health audit preparation

**Regulatory Compliance:**
- Maintain records
- Display certifications
- Follow treatment schedules
- Proper documentation

**Emergency Response:**
- 24/7 availability
- Quick turnaround
- Minimal disruption`,
    image: '🍽️', 
    category: 'Commercial', 
    date: '2025-12-15', 
    readTime: '6 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '13', 
    slug: 'pest-control-warranty', 
    title: 'Understanding Pest Control Warranty Options', 
    excerpt: 'What warranty means and why it matters for your protection.',
    content: `Understanding pest control warranties helps you choose the right protection:

**Types of Warranties:**

1. **Treatment Warranty**
   - Covers re-treatment if pests return
   - Usually 30 days to 1 year
   - Specific to pest type

2. **Service Warranty**
   - Covers labor and materials
   - Annual renewable
   - Varies by company

3. **Termite Warranty**
   - Long-term (5-10 years)
   - Often includes annual inspection
   - Transferable when selling home

**What to Look For:**
- Duration of coverage
- What's included/excluded
- Renewal terms
- Transferability
- Emergency service

**Understanding Terms:**
- "Guarantee" vs "Warranty"
- Re-treatment vs full treatment
- Annual maintenance required
- Exclusions

**Maintaining Your Warranty:**
- Keep treatment records
- Allow annual inspections
- Follow prevention tips
- Report issues immediately

**Questions to Ask:**
1. What's covered?
2. How long does it last?
3. What's not included?
4. Is renewal required?
5. What's the claims process?

**Red Flags:**
- Too good to be true guarantees
- No documentation
- Vague terms
- No professional association`,
    image: '🛡️', 
    category: 'Guide', 
    date: '2025-12-12', 
    readTime: '4 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '14', 
    slug: 'seasonal-pest-calendar', 
    title: 'Seasonal Pest Calendar: Year-Round Protection', 
    excerpt: 'Know when each pest type is most active throughout the year.',
    content: `Different pests are active in different seasons. Here's your year-round pest calendar:

**Spring (March-May)**
- Termites: Swarming season begins
- Ants: Active and foraging
- Cockroaches: Increased activity
- Mice: Seeking indoor shelter

**Summer (June-August)**
- Mosquitoes: Peak breeding
- Flies: Major nuisance
- Cockroaches: Thriving in heat
- Bed bugs: Active travel season

**Fall (September-November)**
- Rodents: Seeking warmth
- Boxelder bugs: Invasion time
- Stink bugs: Entry seeking
- Spiders: Increased sightings

**Winter (December-February)**
- Cockroaches: Indoors only
- Rodents: Active indoors
- Silverfish: Moisture areas
- Stored product pests: Pantries

**Seasonal Prevention:**

*Spring:*
- Termite inspections
- Seal entry points
- Moisture control

*Summer:*
- Mosquito treatment
- Garbage management
- Window screens

*Fall:*
- Exterior treatments
- Rodent proofing
- Leaf cleanup

*Winter:*
- Indoor treatments
- Storage checks
- Maintenance

**Year-Round Tasks:**
- Regular inspections
- Proper hygiene
- Professional treatments
- Quick response`,
    image: '📅', 
    category: 'Seasonal', 
    date: '2025-12-10', 
    readTime: '5 min read',
    author: 'Pest Kill Expert Team'
  },
  { 
    _id: '15', 
    slug: 'pest-control-costs', 
    title: 'Pest Control Services: What to Expect to Pay', 
    excerpt: 'Transparent pricing guide for pest control services.',
    content: `Understanding pest control costs helps you budget and compare services:

**Factors Affecting Cost:**
- Property size
- Type of pest
- Severity of infestation
- Treatment method
- Location
- Service frequency

**Average Costs:**

*Home Pest Control (cockroaches, bed bugs, rodents, ants, mosquitoes):*

- 1BHK: ₹1,200
- 2BHK: ₹1,500
- 3BHK: ₹1,500
- Bigger homes and villas: quote after inspection

*Anti-Termite Treatment:*

- Post-construction (existing buildings): ₹6-9/sq ft
- Pre-construction (soil treatment): ₹12-15/sq ft
- Porous pipe system: ₹22-25/sq ft

*Commercial Sites:*

- Quoted after a free site survey

**What's Included:**
- Inspection
- Treatment
- Follow-up
- Warranty

**What's Not Usually Included:**
- Major repairs
- Repeat severe infestations
- Specialized treatments
- Emergency calls

**Getting the Best Value:**
- Compare quotes
- Check reviews
- Verify certifications
- Ask about guarantees
- Consider annual contracts

**Red Flags:**
- Very low prices
- No inspection required
- Cash only
- No written quote
- Unsure about methods`,
    image: '💰', 
    category: 'Guide', 
    date: '2025-12-08', 
    readTime: '4 min read',
    author: 'Pest Kill Expert Team'
  },
];

const Blog = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const categories = ['all', 'Termite Control', 'Cockroach Control', 'Rodent Control', 'Bed Bugs', 'Seasonal', 'Prevention', 'Commercial', 'FAQ', 'Guide'];

  const filteredPosts = blogPosts.filter(post => {
    if (filter !== 'all' && post.category !== filter) return false;
    if (search && !post.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div className="container">
          <h1>Pest Control <span className="text-gradient">Blog</span></h1>
          <p>Expert tips, guides, and information for a pest-free home</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="blog-filters">
            <input type="text" placeholder="Search blogs..." className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="category-filters">
              {categories.map(cat => (
                <button key={cat} className={`category-btn ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="blog-grid">
            {filteredPosts.map(post => (
              <Link key={post._id} to={`/blog/${post.slug}`} className="blog-card">
                <div className="blog-image" style={{background: categoryColors[post.category] || '#0B1F3A', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', minHeight:'120px'}}>
                  {categoryIcons[post.category] || <Sparkles size={32} />}
                </div>
                <div className="blog-content">
                  <span className="blog-category">{post.category}</span>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="blog-meta">
                    <span>{post.date}</span> · <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;