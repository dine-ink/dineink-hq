function classNames(...classes: String[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TestimonialsSection() {
  const featuredTestimonial = {
    body: "DineInk made our billing process much faster. Managing tables, menu items and staff is now simple and smooth.",
    author: {
      name: "Arun Kumar",
      handle: "Spice Garden Restaurant",
      imageUrl: "https://i.pravatar.cc/150?img=12",
      logoUrl: "https://dummyimage.com/100x40/ffffff/991b1b&text=DineInk",
    },
  };
  const testimonials = [
    [
      [
        {
          body: "The table management feature is excellent for our dine-in customers.",
          author: {
            name: "Priya Sharma",
            handle: "Cafe Aroma",
            imageUrl: "https://i.pravatar.cc/150?img=32",
          },
        },
      ],
    ],
    [
      [
        {
          body: "We now manage takeaway and delivery orders much more easily.",
          author: {
            name: "Rahul Verma",
            handle: "Burger Point",
            imageUrl: "https://i.pravatar.cc/150?img=22",
          },
        },
        {
          body: "Reports and sales tracking have helped us improve daily operations.",
          author: {
            name: "Meena Patel",
            handle: "Royal Biryani",
            imageUrl: "https://i.pravatar.cc/150?img=45",
          },
        },
      ],
    ],
  ];

  return (
    <div className="relative isolate mt-32 sm:mt-56 sm:pt-32">
      <svg
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden size-full mask-[radial-gradient(64rem_64rem_at_top,white,transparent)] stroke-gray-200 sm:block"
      >
        <defs>
          <pattern
            x="50%"
            y={0}
            id="55d3d46d-692e-45f2-becd-d8bdc9344f45"
            width={200}
            height={200}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y={0} className="overflow-visible fill-gray-50">
          <path
            d="M-200.5 0h201v201h-201Z M599.5 0h201v201h-201Z M399.5 400h201v201h-201Z M-400.5 600h201v201h-201Z"
            strokeWidth={0}
          />
        </svg>
        <rect
          fill="url(#55d3d46d-692e-45f2-becd-d8bdc9344f45)"
          width="100%"
          height="100%"
          strokeWidth={0}
        />
      </svg>
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 transform-gpu overflow-hidden opacity-30 blur-3xl"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="ml-[max(50%,38rem)] aspect-[1313/771] w-[82rem] bg-gradient-to-tr from-red-300 to-rose-500"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 flex transform-gpu overflow-hidden pt-32 opacity-25 blur-3xl sm:pt-40 xl:justify-end"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="-ml-88 aspect-[1313/771] w-[82rem] flex-none origin-top-right rotate-30 bg-gradient-to-tr from-red-300 to-rose-500 xl:mr-[calc(50%-12rem)] xl:ml-0"
          />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold text-[#b10000]">
              Trusted by Restaurants
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Restaurant owners love using DineInk
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              From cafes to fine dining restaurants, DineInk helps businesses
              simplify billing, menu management, staff access and reporting.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm/6 text-gray-900 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-4">
            <figure className="rounded-3xl border border-red-100 bg-white shadow-xl ring-1 ring-red-100/50 sm:col-span-2 xl:col-start-2 xl:row-end-1">
              <blockquote className="p-8 text-lg font-semibold leading-8 tracking-tight text-gray-900 sm:p-12 sm:text-xl">
                <p>{`“${featuredTestimonial.body}”`}</p>
              </blockquote>
              <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-4 border-t border-red-100 px-6 py-5 sm:flex-nowrap">
                <img
                  alt=""
                  src={featuredTestimonial.author.imageUrl}
                  className="size-10 flex-none rounded-full bg-gray-50"
                />
                <div className="flex-auto">
                  <div className="font-semibold text-gray-900">
                    {featuredTestimonial.author.name}
                  </div>
                  <div className="text-gray-600">{`@${featuredTestimonial.author.handle}`}</div>
                </div>
                <img
                  alt=""
                  src={featuredTestimonial.author.logoUrl}
                  className="h-10 w-auto flex-none"
                />
              </figcaption>
            </figure>
            {testimonials.map((columnGroup, columnGroupIdx) => (
              <div
                key={columnGroupIdx}
                className="space-y-8 xl:contents xl:space-y-0"
              >
                {columnGroup.map((column, columnIdx) => (
                  <div
                    key={columnIdx}
                    className={classNames(
                      (columnGroupIdx === 0 && columnIdx === 0) ||
                        (columnGroupIdx === testimonials.length - 1 &&
                          columnIdx === columnGroup.length - 1)
                        ? "xl:row-span-2"
                        : "xl:row-start-1",
                      "space-y-8",
                    )}
                  >
                    {column.map((testimonial) => (
                      <figure
                        key={testimonial.author.handle}
                        className="rounded-3xl border border-red-100 bg-white p-6 shadow-lg ring-1 ring-red-100/50 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <blockquote className="text-gray-900">
                          <p>{`“${testimonial.body}”`}</p>
                        </blockquote>
                        <figcaption className="mt-6 flex items-center gap-x-4">
                          <img
                            alt=""
                            src={testimonial.author.imageUrl}
                            className="size-10 rounded-full bg-gray-50"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">
                              {testimonial.author.name}
                            </div>
                            <div className="text-gray-600">{`@${testimonial.author.handle}`}</div>
                          </div>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
