class Entity < ApplicationRecord
  enum :kind, %w[sovereign partially_recognized territory].index_by(&:itself), validate: true

  belongs_to :parent, class_name: "Entity", optional: true
  has_many :observations, dependent: :restrict_with_exception

  scope :profiled, -> { where.not(kind: :territory) }

  validates :code, format: {with: /\A[A-Z]{3}\z/}, uniqueness: true
  validates :parent, presence: true, if: :territory?
  validates :parent, absence: true, unless: :territory?
end
