import { ArrowUpRight, Check } from "lucide-react"
import { GradientButton } from "@/components/ui/gradient-button"
import Link from "next/link"

interface Cta4Props {
  title?: string
  description?: string
  buttonText?: string
  buttonUrl?: string
  items?: string[]
}

const defaultItems = [
  "Easy Integration",
  "24/7 Support",
  "Customizable Design",
  "Scalable Performance",
  "Hundreds of Blocks",
]

export const Cta4 = ({
  title = "Call to Action",
  description = "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Architecto illo praesentium nisi, accusantium quae.",
  buttonText = "Get Started",
  buttonUrl = "https://shadcnblocks.com",
  items = defaultItems,
}: Cta4Props) => {
  return (
    <section className="py-12 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-center">
          <div className="max-w-5xl w-full">
            <div className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-gradient-to-br from-gray-900/50 to-black px-6 py-10 md:flex-row lg:px-20 lg:py-16" style={{ border: '1px solid #1a1a1a', borderRadius: '16px' }}>
              <div className="md:w-1/2">
                <h4 className="mb-1 text-2xl font-bold md:text-3xl text-white">{title}</h4>
                <p className="text-gray-300 text-base md:text-lg">{description}</p>
                <div className="mt-6">
                  <GradientButton variant="default" asChild>
                    <Link href={buttonUrl}>
                      {buttonText}
                      <ArrowUpRight className="ml-2 w-4 h-4" />
                    </Link>
                  </GradientButton>
                </div>
              </div>
              <div className="md:w-1/3">
                <ul className="flex flex-col space-y-3 text-sm font-medium">
                  {items.map((item, idx) => (
                    <li className="flex items-center text-gray-200" key={idx}>
                      <Check className="mr-4 size-4 flex-shrink-0 text-purple-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

